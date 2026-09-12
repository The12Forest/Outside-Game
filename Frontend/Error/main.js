window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("msg");
    const status = params.get("status");

    const title = document.getElementById("errorTitle");
    const message = document.getElementById("errorMessage");
    const statusEl = document.getElementById("errorStatus");

    // Status code, if sent (e.g. /error?msg=wrong-code&status=401)
    if (status) {
        statusEl.textContent = `Fehler ${status}`;
        statusEl.classList.remove("hidden");
    }

    // Message mapping. Unknown keys fall back to the generic text.
    if (msg) {
        switch (msg) {
            case "wrong-code":
                title.textContent = "Falscher Code";
                message.textContent = "Der eingegebene Code ist ungültig. Bitte überprüfe ihn und versuch es erneut.";
                break;
            case "faildeGPS":
                title.textContent = "Failed GPS";
                message.textContent = "Der Server konnte das GPS noch nicht laden, bitte versuche es erneut.";
                break;
            default:
                // Show a raw message if provided, else keep the default text
                title.textContent = "Etwas ist schiefgelaufen";
                if (params.has("text")) {
                    message.textContent = params.get("text");
                }
        }
    }
});

