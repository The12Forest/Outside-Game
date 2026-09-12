async function submitCode(code) {
    const isValid = await checkPlayCode(code);
    if (isValid) {
        window.location.href = "/game";
    } else {
        window.location.href = "/error/?msg=wrong-code&status=401";
    }
}

window.addEventListener("load", async () => {
    // Join directly when arriving via a scanned QR code (?code=XXXX)
    const params = new URLSearchParams(window.location.search);
    const qrCode = params.get("code");
    if (qrCode) {
        document.getElementById("GroupAName").value = qrCode;
        await submitCode(qrCode);
        return;
    }

    //AutoLogin
    const code = getCookie("code");
    if (code) {
        const isValid = await checkPlayCode(code);
        if (isValid) {
            window.location.href = "/game";
            return;
        } else {
            delCookie("code")
            console.warn("Stored Password for code is wrong!");
        }
    }
});

document.getElementById("GameCodeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("GroupAName").value;
    await submitCode(code);
});

