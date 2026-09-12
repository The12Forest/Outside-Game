let Camera_facing = "environment";
let isRunner
let countdownobj
let performance_mode = true
let mapsLinkUpdate


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
    } else {
        window.location.href = "/";
    }

    const group = getCookie("group");
    if (group) {
        switch (group) {
            case "runner":
                isRunner = true
                await startCamera(Camera_facing);
                await stopCamera();
                break;
            case "catcher":
                isRunner = false
                initImageUpdater("image_container");
                startImageUpdater();
                await startCamera(Camera_facing);
                await stopCamera();
                break;
            default:
                delCookie("code")
                delCookie("group")

                window.location.href = "/";
                break;
        }
    } else {
        delCookie("code")
        delCookie("group")
        window.location.href = "/";
    }

    reDraw("countdown")

    startTelemetry(10 * 1000) //every 10 sec
    await syncServerTime();
    countdownobj = new countdown("countdown_p", () => {
        onTimeEnd()
    });
});

document.getElementById("startCameraBtn").addEventListener("click", async () => {
    startCamera()
    reDraw("camera_active")
})

document.getElementById("video").addEventListener("click", async () => {
    switchCamera();
});

document.getElementById("showImageBtn").addEventListener("click", async () => {
    image_active = true
    reDraw()
});

document.getElementById("hideImageBtn").addEventListener("click", async () => {
    image_active = false
    reDraw()
});

document.getElementById("Capture_image").addEventListener("click", async () => {
    stopCamera()
    try {
        const blob = await takePhoto();
        if (blob) {
            sendImage(blob);
            reDraw("Countdown")
        }
    } catch (err) {
        console.error("Capture failed:", err);
    }

})

function onTimeEnd() {
    reDraw("positon_shown")
    let button = document.getElementById("linkToMaps_a")
    let message = document.getElementById("linkToMaps_p")
    let message_last_update = document.getElementById("last_updated_position")
    if (isRunner) {
        startVibrating()
        message.innerText = "Since you failed to provide an image of your position, the oponent team will recieve a live position until you send an image!"
    } else {
        if ('vibrate' in navigator) {
            navigator.vibrate(500);
        }
        const deleteInterval = () => { clearInterval(mapsLinkUpdate); mapsLinkUpdate = undefined }
        if (mapsLinkUpdate) { deleteInterval() }
        mapsLinkUpdate = setInterval(async () => {
            let res = await fetch("/api/telemetry/position")
            if (!res.ok) { deleteInterval(); return}
            let data = await res.json()
            if (!data.ok) { deleteInterval(); return}
            if (!data.gps.ok) { deleteInterval(); return }
            button.href = `https://www.google.com/maps/place/${data.gps.latitude},${data.gps.longitude}`
            let time = Date.now() - data.gps.time
            message_last_update.innerText = Math.floor(time / 1_000)
            if ('vibrate' in navigator) {
                navigator.vibrate(20);
            }
        }, 1000)
    }
}


