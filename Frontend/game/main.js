let Camera_facing = "user";

window.addEventListener("load", async () => {
    //AutoLogin
    const code = getCookie("code");
    if (code) {
        const isValid = await checkPlayCode(code);
        console.log(isValid)
        if (!isValid) {
            delCookie("code")
            window.location.href = "/";
            return;
        }
    }

    await startCamera(Camera_facing);
});


document.getElementById("video").addEventListener("click", () => {
    switchCamera();
});

document.getElementById("Capture_image").addEventListener("click", async () => {
    try {
        const blob = await takePhoto();
        if (blob) {
            sendImage(blob);
        }
    } catch (err) {
        console.error("Capture failed:", err);
    }
})