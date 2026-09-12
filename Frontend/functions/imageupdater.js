let imageUpdaterTimer
let imageUpdaterContainer     
let imageUpdaterImg           
let imageUpdaterObjectUrl     
let imageUpdaterInterval = 500
let imageUpdaterInFlight = false
let imageUpdaterOnUpdate

function initImageUpdater(target = "image_container", onUpdate) {
    if (onUpdate) imageUpdaterOnUpdate = onUpdate

    let el = typeof target === "string" ? document.getElementById(target) : target

    if (!el) {
        el = document.createElement("div")
        el.id = typeof target === "string" ? target : "image_container"
        document.body.appendChild(el)
    }

    imageUpdaterContainer = el

    imageUpdaterImg = el.tagName === "IMG" ? el : el.querySelector("img")
    if (!imageUpdaterImg) {
        imageUpdaterImg = document.createElement("img")
        imageUpdaterImg.alt = "Received image"
        el.appendChild(imageUpdaterImg)
    }

    return imageUpdaterContainer
}

function currentImageId() {
    return imageUpdaterImg?.dataset.imageId || null
}

function startImageUpdater(intervalMs = imageUpdaterInterval) {
    if (!imageUpdaterImg) initImageUpdater()

    const value = Number(intervalMs)
    if (value > 0) imageUpdaterInterval = value

    stopImageUpdater()

    pollLatestImage()
    imageUpdaterTimer = setInterval(pollLatestImage, imageUpdaterInterval)
    return imageUpdaterTimer
}

function stopImageUpdater() {
    if (imageUpdaterTimer) clearInterval(imageUpdaterTimer)
    imageUpdaterTimer = undefined
}

async function pollLatestImage() {
    if (imageUpdaterInFlight) return
    imageUpdaterInFlight = true

    try {
        const id = currentImageId()
        const query = id ? "?id=" + encodeURIComponent(id) : ""

        const res = await fetch("/api/image/latest" + query, { cache: "no-store" })

        if (!res.ok) return

        const type = res.headers.get("Content-Type") || ""

        if (!type.startsWith("image/")) return

        const newId = res.headers.get("X-Image-Id") || null

        if (newId && newId === id) return

        renderImage(await res.blob(), newId)
    } catch (err) {
        console.error("Image update failed:", err)
    } finally {
        imageUpdaterInFlight = false
    }
}

function renderImage(blob, id) {
    if (!blob || blob.size === 0) return

    const previousUrl = imageUpdaterObjectUrl
    const url = URL.createObjectURL(blob)

    imageUpdaterObjectUrl = url
    imageUpdaterImg.src = url
    if (id) imageUpdaterImg.dataset.imageId = id

    if (previousUrl) URL.revokeObjectURL(previousUrl)

    if (typeof imageUpdaterOnUpdate === "function") imageUpdaterOnUpdate(id, url)
}
