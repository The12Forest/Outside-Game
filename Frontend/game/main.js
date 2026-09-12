let Camera_facing = "environment";
let isRunner
let countdownobj
let performance_mode = true
let mapsLinkUpdate
let gameStarted = false
let statusPoll


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

    startTelemetry(10 * 1000) //every 10 sec
    startStreamMonitor() //allow admin to request a live camera stream
    await syncServerTime();

    showWaiting()
    await checkGameStatus()
    statusPoll = setInterval(checkGameStatus, 1000)
});

async function checkGameStatus() {
    try {
        const res = await fetch("/api/time/deadline")
        if (!res.ok) return
        const data = await res.json()
        const running = data.state === "running"

        if (running && !gameStarted) {
            gameStarted = true
            startGameCountdown()
        } else if (!running && gameStarted) {
            gameStarted = false
            stopCountdownUI()
            showWaiting()
        } else if (!running) {
            // keep the device id fresh while the game hasn't started yet
            updateDeviceId(true)
        }
    } catch (err) {
        console.error("Game status check failed:", err)
    }
}

function updateDeviceId(show) {
    const el = document.getElementById("game_code")
    if (!el) return
    if (show) {
        const id = getDeviceId()
        el.textContent = id ? `Device: ${id.slice(0, 8)}` : ""
    } else {
        el.textContent = ""
    }
}

function showWaiting() {
    const p = document.getElementById("countdown_p")
    if (p) p.textContent = "Waiting…"
    const sub = document.getElementById("countodwn_subtitle")
    if (sub) sub.textContent = "Waiting for the admin to start the game…"

    updateDeviceId(true)

    // Reset to a clean waiting screen (only the countdown area)
    document.getElementById("countdown_div").classList.remove("invisible")
    document.getElementById("camera").classList.add("invisible")
    document.getElementById("linkToMaps").classList.add("invisible")
    document.getElementById("image").classList.add("invisible")
    document.getElementById("Capture_image").classList.add("invisible")
    document.getElementById("startCameraBtn").classList.add("invisible")
    document.getElementById("showImageBtn").classList.add("invisible")
    document.getElementById("hideImageBtn").classList.add("invisible")
    document.getElementById("linkToMaps_a").classList.add("invisible")
}

function startGameCountdown() {
    if (countdownobj) return
    resetLoadingTitles() // allow the message to show once for this game
    reDraw("countdown")
    updateDeviceId(false)
    countdownobj = new countdown("countdown_p", () => {
        onTimeEnd()
    })
}

function stopCountdownUI() {
    if (countdownobj) {
        if (countdownobj.timer) clearInterval(countdownobj.timer)
        if (countdownobj.updater) clearInterval(countdownobj.updater)
        countdownobj.timer = null
        countdownobj.updater = null
        countdownobj = null
    }
}

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


