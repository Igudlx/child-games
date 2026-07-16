using System.Collections;
using PlayFab;
using PlayFab.ClientModels;
using UnityEngine;
using UnityEngine.UI;

namespace ChildGames
{
    /// <summary>
    /// Drives the in-game "Link Account" button.
    ///
    /// Wire this up in the Inspector:
    ///   - linkCodeText: a TextMeshProUGUI/Text that shows the code
    ///   - statusText: a Text that shows "Requesting code...", "LINKED",  etc.
    ///   - linkButton: the VR-interactable button that starts the flow
    ///
    /// Flow:
    ///   1. Player presses the Link Account button (OnLinkButtonPressed).
    ///   2. We already have a PlayFab SessionTicket from the normal
    ///      PlayFab login that happens when the game boots.
    ///   3. We ask ChildGamesAPI for a link code, display it in VR.
    ///   4. Player reads the code and types it into the website.
    ///   5. We poll /api/link/status/{code} until it flips to "linked".
    /// </summary>
    public class LinkAccountManager : MonoBehaviour
    {
        [Header("UI References")]
        public Text linkCodeText;
        public Text statusText;
        public Button linkButton;

        [Header("Polling")]
        [Tooltip("Seconds between status checks while waiting for the player to enter the code on the website.")]
        public float pollIntervalSeconds = 2.5f;

        private string _currentCode;
        private Coroutine _pollRoutine;

        private void Start()
        {
            if (linkButton != null)
                linkButton.onClick.AddListener(OnLinkButtonPressed);

            SetStatus("");
            SetCode("");
        }

        public void OnLinkButtonPressed()
        {
            if (!PlayFabClientAPI.IsClientLoggedIn())
            {
                SetStatus("Not logged into PlayFab yet.");
                return;
            }

            SetStatus("Requesting code…");
            linkButton.interactable = false;

            // The SessionTicket from the current PlayFab login proves this
            // request is coming from whoever is actually signed in right now.
            string sessionTicket = PlayFabSettings.staticPlayer.ClientSessionTicket;

            ChildGamesAPI.Instance.RequestLinkCode(sessionTicket, OnCodeReceived);
        }

        private void OnCodeReceived(ChildGamesAPI.GenerateCodeResponse response)
        {
            linkButton.interactable = true;

            if (response == null || string.IsNullOrEmpty(response.code))
            {
                SetStatus("Could not get a link code. Try again.");
                return;
            }

            _currentCode = response.code;
            SetCode(_currentCode);
            SetStatus($"Enter this code at the Child Games website within {response.expiresInMinutes} minutes.");

            if (_pollRoutine != null) StopCoroutine(_pollRoutine);
            _pollRoutine = StartCoroutine(PollForLinkCompletion());
        }

        private IEnumerator PollForLinkCompletion()
        {
            while (true)
            {
                yield return new WaitForSeconds(pollIntervalSeconds);

                bool done = false;
                ChildGamesAPI.Instance.CheckLinkStatus(_currentCode, (status) =>
                {
                    if (status == null) return;

                    switch (status.status)
                    {
                        case "linked":
                            SetStatus("LINKED ✓");
                            SetCode("");
                            done = true;
                            break;
                        case "expired":
                        case "not_found":
                            SetStatus("Code expired. Press Link Account to try again.");
                            SetCode("");
                            done = true;
                            break;
                        // "pending" -> keep polling
                    }
                });

                if (done) yield break;
            }
        }

        private void SetCode(string code)
        {
            if (linkCodeText != null) linkCodeText.text = code;
        }

        private void SetStatus(string status)
        {
            if (statusText != null) statusText.text = status;
        }
    }
}
