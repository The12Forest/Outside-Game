async function startCamera(facingMode) {
    const video = document.getElementById("video");

    if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        video.src = "fallbackvideo.webm";
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 4096 },
                height: { ideal: 2160 },
            },
            audio: false,
        });

        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.();
        if (caps?.width?.max && caps?.height?.max) {
            try {
                await track.applyConstraints({
                    width: { ideal: caps.width.max },
                    height: { ideal: caps.height.max },
                });
            } catch (err) {
                console.warn("Could not apply max resolution:", err);
            }
        }

        video.srcObject = stream;
        await video.play();

        video.classList.toggle("mirror", facingMode === "user");
        Camera_facing = facingMode;

        console.log(`Camera: ${video.videoWidth}x${video.videoHeight} (max ${caps?.width?.max ?? "?"}x${caps?.height?.max ?? "?"})`);
    } catch (err) {
        console.error("Camera access failed:", err);
        video.src = "fallbackvideo.webm";
    }
}

function switchCamera() {
    Camera_facing = Camera_facing === "user" ? "environment" : "user";
    return startCamera(Camera_facing);
}

function takePhoto() {
    stopVibrating() 
    const video = document.getElementById("video");

    if (!video || !video.videoWidth || !video.videoHeight) {
        return Promise.reject(new Error("No active camera stream"));
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (Camera_facing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
    });
}

async function sendImage(blob, filename) {
    if (!blob) return { ok: false, error: "no blob" };

    try {
        const response = await fetch("/api/image/post", {
            method: "POST",
            headers: {
                "Content-Type": blob.type || "image/jpeg"
            },
            body: blob
        });

        const data = await response.json();
        if (!data.ok) console.error("Image upload failed:", data.error);
        return data;
    } catch (err) {
        console.error("Image upload failed:", err);
        return { ok: false, error: String(err) };
    }
}

function stopCamera() {
    if (!performance) { 
        const video = document.getElementById("video");

        if (video.srcObject) {
            video.srcObject.getTracks().forEach((track) => track.stop());
            video.srcObject = null;
        }
        video.classList.remove("mirror");
    }
}
