using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace ChildGames
{
    /// <summary>
    /// Core HTTP client that talks to the Child Games website backend
    /// (the Next.js API routes deployed on Vercel).
    ///
    /// Attach this to a persistent GameObject (e.g. an empty
    /// "ChildGamesManager" that survives scene loads via
    /// DontDestroyOnLoad) and set childGamesApiBaseUrl in the Inspector
    /// to your deployed site, e.g. https://child-games.vercel.app
    ///
    /// This script does NOT know your PlayFab secret key — it only
    /// ever sends a session ticket, which is safe to hold client-side
    /// and is validated server-to-server by the backend against PlayFab.
    /// </summary>
    public class ChildGamesAPI : MonoBehaviour
    {
        public static ChildGamesAPI Instance { get; private set; }

        [Header("Backend")]
        [Tooltip("Your deployed Child Games site, no trailing slash. e.g. https://child-games.vercel.app")]
        public string childGamesApiBaseUrl = "https://child-games.vercel.app";

        [Header("This game's identity")]
        [Tooltip("Must exactly match the \"id\" field for this game in lib/games.config.ts on the website.")]
        public string gameId = "example-game-one";

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

        [Serializable]
        private class GenerateCodeRequest
        {
            public string gameId;
            public string sessionTicket;
        }

        [Serializable]
        public class GenerateCodeResponse
        {
            public string code;
            public int expiresInMinutes;
            public string error;
        }

        [Serializable]
        public class LinkStatusResponse
        {
            public string status; // "pending" | "linked" | "expired" | "not_found"
        }

        /// <summary>
        /// Requests a fresh link code for the currently logged-in PlayFab
        /// player. Call this after PlayFabClientAPI login has completed,
        /// so a valid SessionTicket is available.
        /// </summary>
        public void RequestLinkCode(string sessionTicket, Action<GenerateCodeResponse> onComplete)
        {
            var payload = new GenerateCodeRequest { gameId = gameId, sessionTicket = sessionTicket };
            string json = JsonUtility.ToJson(payload);
            StartCoroutine(PostJson("/api/link/generate-code", json, onComplete));
        }

        /// <summary>
        /// Polls whether a previously generated code has been redeemed on
        /// the website yet. Call this every 2-3 seconds while showing the
        /// "LINKING..." screen in-game.
        /// </summary>
        public void CheckLinkStatus(string code, Action<LinkStatusResponse> onComplete)
        {
            StartCoroutine(GetJson($"/api/link/status/{code}", onComplete));
        }

        private IEnumerator PostJson<T>(string path, string json, Action<T> onComplete)
        {
            string url = childGamesApiBaseUrl + path;
            var request = new UnityWebRequest(url, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            HandleResponse(request, onComplete);
        }

        private IEnumerator GetJson<T>(string path, Action<T> onComplete)
        {
            string url = childGamesApiBaseUrl + path;
            using var request = UnityWebRequest.Get(url);
            yield return request.SendWebRequest();

            HandleResponse(request, onComplete);
        }

        private void HandleResponse<T>(UnityWebRequest request, Action<T> onComplete)
        {
            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"[ChildGamesAPI] Request failed: {request.error}\n{request.downloadHandler.text}");
                onComplete?.Invoke(default);
                return;
            }

            try
            {
                T parsed = JsonUtility.FromJson<T>(request.downloadHandler.text);
                onComplete?.Invoke(parsed);
            }
            catch (Exception e)
            {
                Debug.LogError($"[ChildGamesAPI] Failed to parse response: {e.Message}\n{request.downloadHandler.text}");
                onComplete?.Invoke(default);
            }
        }
    }
}
