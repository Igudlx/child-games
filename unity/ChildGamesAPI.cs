// ChildGamesAPI.cs
//
// WHERE THIS GOES:
//   Assets/ChildGames/Scripts/ChildGamesAPI.cs
//
// WHAT IT DOES:
//   Thin HTTP client for talking to your Vercel backend (the Next.js API
//   routes under app/api/unity/). This script NEVER contains a PlayFab
//   Secret Key — it only ever sends the player's PlayFab Session Ticket,
//   which the backend verifies server-side. That's what keeps the Secret
//   Key safely on Vercel and out of the game client entirely.
//
// SETUP:
//   1. Create an empty GameObject in your first/boot scene, name it
//      "ChildGamesAPI".
//   2. Attach this script to it.
//   3. In the Inspector, set "Backend Base Url" to your deployed Vercel URL,
//      e.g. https://childgames.vercel.app  (no trailing slash).
//   4. Make sure this GameObject is marked DontDestroyOnLoad (this script
//      does that itself in Awake) so it survives scene loads.

using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace ChildGames
{
    public class ChildGamesAPI : MonoBehaviour
    {
        public static ChildGamesAPI Instance { get; private set; }

        [Header("Backend")]
        [Tooltip("Your deployed Vercel URL, no trailing slash. e.g. https://childgames.vercel.app")]
        public string backendBaseUrl = "https://childgames.vercel.app";

        [Tooltip("Must match the 'id' field of this game's entry in lib/games.config.ts on the website.")]
        public string gameId = "example-vr-game";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ---------------------------------------------------------------
        // Generate Link Code
        // Calls POST {backend}/api/unity/generate-link-code
        // Body: { gameId, sessionTicket }
        // The backend verifies the session ticket against PlayFab using
        // the Secret Key (server-side only), then returns a fresh code.
        // ---------------------------------------------------------------
        public void GenerateLinkCode(string sessionTicket, Action<LinkCodeResponse> onSuccess, Action<string> onError)
        {
            StartCoroutine(GenerateLinkCodeRoutine(sessionTicket, onSuccess, onError));
        }

        private IEnumerator GenerateLinkCodeRoutine(string sessionTicket, Action<LinkCodeResponse> onSuccess, Action<string> onError)
        {
            var requestBody = new LinkCodeRequest
            {
                gameId = this.gameId,
                sessionTicket = sessionTicket
            };
            string json = JsonUtility.ToJson(requestBody);

            string url = $"{backendBaseUrl}/api/unity/generate-link-code";
            using (var req = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");

                yield return req.SendWebRequest();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    string body = req.downloadHandler != null ? req.downloadHandler.text : "";
                    onError?.Invoke(string.IsNullOrEmpty(body) ? req.error : body);
                    yield break;
                }

                var response = JsonUtility.FromJson<LinkCodeResponse>(req.downloadHandler.text);
                onSuccess?.Invoke(response);
            }
        }

        [Serializable]
        public class LinkCodeRequest
        {
            public string gameId;
            public string sessionTicket;
        }

        [Serializable]
        public class LinkCodeResponse
        {
            public string code;
            public string expiresAt;
            public int expiresInSeconds;
        }
    }
}
