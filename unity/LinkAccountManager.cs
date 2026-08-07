// LinkAccountManager.cs
//
// WHERE THIS GOES:
//   Assets/ChildGames/Scripts/LinkAccountManager.cs
//
// WHAT IT DOES:
//   Drives the in-game "Link your Child Games account" screen. Player
//   presses a button (world-space VR canvas or flat-screen UI), this
//   script fetches their current PlayFab session ticket (they must already
//   be logged into PlayFab via your normal login flow), sends it to
//   ChildGamesAPI.GenerateLinkCode(), and displays the returned code with
//   a countdown until it expires.
//
// SETUP IN UNITY:
//   1. Requires the PlayFab Unity SDK already installed and the player
//      already logged in via PlayFabClientAPI.LoginWithCustomID (or
//      whatever login method you use) BEFORE this screen opens — this
//      script does not perform login itself, it only reads the existing
//      session.
//   2. Create a World Space Canvas (for VR) or Screen Space Canvas with:
//        - a TMP_Text for the code ("codeText")
//        - a TMP_Text for the countdown ("expiryText")
//        - a Button ("Generate Code") wired to GenerateCode()
//        - a TMP_Text for errors ("errorText")
//   3. Attach this script to the Canvas (or a manager object) and drag
//      the above references into the Inspector fields.
//   4. Make sure a ChildGamesAPI component exists in the scene (see
//      ChildGamesAPI.cs setup instructions).

using System.Collections;
using PlayFab;
using PlayFab.ClientModels;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ChildGames
{
    public class LinkAccountManager : MonoBehaviour
    {
        [Header("UI References")]
        public Button generateButton;
        public TMP_Text codeText;
        public TMP_Text expiryText;
        public TMP_Text errorText;

        private string _currentSessionTicket;
        private float _expiresInSeconds;
        private Coroutine _countdownRoutine;

        private void OnEnable()
        {
            // PlayFabClientAPI keeps the session ticket around after login;
            // this is available immediately if the player already logged in.
            _currentSessionTicket = PlayFabSettings.staticPlayer.ClientSessionTicket;

            if (errorText != null) errorText.text = "";
            if (codeText != null) codeText.text = "";
            if (expiryText != null) expiryText.text = "";
        }

        public void GenerateCode()
        {
            if (string.IsNullOrEmpty(_currentSessionTicket))
            {
                ShowError("You must be logged in before linking your account.");
                return;
            }

            SetInteractable(false);
            if (errorText != null) errorText.text = "";

            ChildGamesAPI.Instance.GenerateLinkCode(
                _currentSessionTicket,
                onSuccess: (response) =>
                {
                    SetInteractable(true);
                    if (codeText != null) codeText.text = response.code;
                    _expiresInSeconds = response.expiresInSeconds;

                    if (_countdownRoutine != null) StopCoroutine(_countdownRoutine);
                    _countdownRoutine = StartCoroutine(CountdownRoutine());
                },
                onError: (error) =>
                {
                    SetInteractable(true);
                    ShowError($"Could not generate link code: {error}");
                }
            );
        }

        private IEnumerator CountdownRoutine()
        {
            while (_expiresInSeconds > 0)
            {
                if (expiryText != null)
                {
                    int minutes = Mathf.FloorToInt(_expiresInSeconds / 60f);
                    int seconds = Mathf.FloorToInt(_expiresInSeconds % 60f);
                    expiryText.text = $"Expires in {minutes:00}:{seconds:00}";
                }
                yield return new WaitForSeconds(1f);
                _expiresInSeconds -= 1f;
            }

            if (expiryText != null) expiryText.text = "Code expired — generate a new one";
            if (codeText != null) codeText.text = "";
        }

        private void ShowError(string message)
        {
            if (errorText != null) errorText.text = message;
            Debug.LogWarning($"[ChildGames] {message}");
        }

        private void SetInteractable(bool value)
        {
            if (generateButton != null) generateButton.interactable = value;
        }
    }
}
