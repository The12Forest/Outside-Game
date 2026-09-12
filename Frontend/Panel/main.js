// ---- Admin Overview -------------------------------------------------------
let devices = []
let selectedDevice = null
let map = null
let markers = {}
let streamPollTimer = null
let frameUrl = null

const $ = (id) => document.getElementById(id)

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]))
}

function shortId(id) {
    return id ? id.slice(0, 8) : "—"
}

// ---- Auth ----------------------------------------------------------------
async function ensureAuth() {
    try {
        const res = await fetch("/api/admin/session")
        if (!res.ok) {
            window.location.href = "/admin"
            return false
        }
        return true
    } catch (err) {
        window.location.href = "/admin"
        return false
    }
}

// ---- Clock ----------------------------------------------------------------
function tickClock() {
    const now = new Date()
    $("clock").textContent = now.toLocaleTimeString("de-DE")
}

// ---- Team codes + QR ------------------------------------------------------
let currentTeam = { runner: null, catcher: null, runnerName: "Runner", catcherName: "Catcher" }

function renderQR(containerId, code, size = 240) {
    const el = $(containerId)
    if (!el || !code || typeof QRCodeStyling === "undefined") {
        if (el) el.innerHTML = '<span class="qr-placeholder">No code yet</span>'
        return
    }
    el.innerHTML = ""
    const url = window.location.origin + "/?code=" + code
    try {
        const qr = new QRCodeStyling({
            width: size,
            height: size,
            data: url,
            margin: 8,
            qrOptions: { errorCorrectionLevel: "M" },
            dotsOptions: { color: "#14101f", type: "rounded" },
            backgroundOptions: { color: "#ffffff" }
        })
        qr.append(el)
    } catch (err) {
        el.innerHTML = '<span class="qr-placeholder">QR error</span>'
    }
}

function renderTeam() {
    $("runnerTitle").textContent = currentTeam.runnerName
    $("catcherTitle").textContent = currentTeam.catcherName
    $("runnerCode").textContent = currentTeam.runner ?? "—"
    $("catcherCode").textContent = currentTeam.catcher ?? "—"
    renderQR("qrRunner", currentTeam.runner)
    renderQR("qrCatcher", currentTeam.catcher)

    // fullscreen copies
    $("runnerTitleFull").textContent = currentTeam.runnerName
    $("catcherTitleFull").textContent = currentTeam.catcherName
    $("runnerCodeFull").textContent = currentTeam.runner ?? "—"
    $("catcherCodeFull").textContent = currentTeam.catcher ?? "—"
    renderQR("qrRunnerFull", currentTeam.runner, 340)
    renderQR("qrCatcherFull", currentTeam.catcher, 340)
}

async function loadTeams() {
    try {
        const res = await fetch("/api/code/teams")
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (!res.ok) return
        const data = await res.json()
        if (!data.ok) return

        if (Array.isArray(data.teams) && data.teams.length) {
            const t = data.teams[data.teams.length - 1]
            currentTeam = {
                runner: t.runner,
                catcher: t.catcher,
                runnerName: t.runnerName || "Runner",
                catcherName: t.catcherName || "Catcher"
            }
        } else if (Array.isArray(data.codes) && data.codes.length >= 2) {
            currentTeam = {
                runner: data.codes[0],
                catcher: data.codes[1],
                runnerName: "Runner",
                catcherName: "Catcher"
            }
        }
        renderTeam()
    } catch (err) {
        console.error("loadTeams failed:", err)
    }
}

let pendingNames = null

function requestGenerateCodes() {
    const runnerName = $("runnerName").value.trim() || "Runner"
    const catcherName = $("catcherName").value.trim() || "Catcher"
    pendingNames = { runnerName, catcherName }
    $("confirmText").textContent = `Generate a new code pair for "${runnerName}" (Runner) and "${catcherName}" (Catcher)? Existing codes keep working.`
    $("confirmModal").classList.remove("hidden")
}

function cancelGenerateCodes() {
    pendingNames = null
    $("confirmModal").classList.add("hidden")
}

async function doGenerateCodes() {
    if (!pendingNames) return
    const { runnerName, catcherName } = pendingNames
    pendingNames = null
    const btn = $("genCodesBtn")
    btn.disabled = true
    try {
        const res = await fetch("/api/code/newteam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runnerName, catcherName })
        })
        if (res.status === 401) { window.location.href = "/admin"; return }
        const data = await res.json()
        if (data.ok) {
            currentTeam = {
                runner: data.runner,
                catcher: data.catcher,
                runnerName: data.runnerName || runnerName,
                catcherName: data.catcherName || catcherName
            }
            renderTeam()
            $("runnerName").value = ""
            $("catcherName").value = ""
        }
    } catch (err) {
        console.error("generateCodes failed:", err)
    } finally {
        btn.disabled = false
        $("confirmModal").classList.add("hidden")
    }
}

// ---- Game control ---------------------------------------------------------
let gameState = "waiting"

function formatCountdown(ms) {
    ms = Math.max(0, ms)
    const totalSec = Math.floor(ms / 1000)
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0")
    const s = String(totalSec % 60).padStart(2, "0")
    return `${m}:${s}`
}

function applyGameStatus(data) {
    gameState = data.state || "waiting"
    const running = gameState === "running"

    // Fullscreen: the countdown replaces the QR codes + devices
    $("qrFullscreenContent").classList.toggle("hidden", running)
    $("qrFullscreenCountdown").classList.toggle("hidden", !running)

    if (running) {
        const rem = data.deadline - data.serverTime
        $("gameStatusHint").textContent = `Game running — ${formatCountdown(rem)} left.`
    } else {
        const lead = data.leadtime ? Math.round(data.leadtime / 1000) : "—"
        const interval = data.interval ? Math.round(data.interval / 1000) : "—"
        $("gameStatusHint").textContent = `Game not started. Lead time ${lead}s · Photo interval ${interval}s.`
    }
}

function updateFullscreenCountdown(data) {
    const rem = data.deadline - data.serverTime
    $("fsCountdown").textContent = formatCountdown(rem)
    if (rem <= 0) {
        $("fsCountdownLabel").textContent = "Runner lead time over"
        $("fsCountdownSub").textContent = "The Catcher can go now!"
    } else {
        $("fsCountdownLabel").textContent = "Runner lead time"
        $("fsCountdownSub").textContent = "The Catcher starts when the time is over"
    }
}

async function pollGameStatus() {
    try {
        const res = await fetch("/api/time/deadline")
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (!res.ok) return
        const data = await res.json()
        applyGameStatus(data)
        if (gameState === "running") updateFullscreenCountdown(data)

        // keep inputs in sync with the server (unless the admin is editing them)
        if (data.interval && document.activeElement !== $("intervalInput")) {
            $("intervalInput").value = Math.round(data.interval / 1000)
        }
        if (data.leadtime && document.activeElement !== $("leadtimeInput")) {
            $("leadtimeInput").value = Math.round(data.leadtime / 1000)
        }
    } catch (err) {
        console.error("pollGameStatus failed:", err)
    }
}

async function setIntervalTime() {
    const interval = Number($("intervalInput").value)
    if (!interval || interval <= 0) {
        window.alert("Please enter a valid interval in seconds.")
        return
    }
    try {
        const res = await fetch("/api/time/interval", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interval })
        })
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (res.ok) {
            const data = await res.json()
            applyGameStatus(data)
        }
    } catch (err) {
        console.error("setIntervalTime failed:", err)
    }
}

async function startGame() {
    const leadtime = Number($("leadtimeInput").value)
    if (!leadtime || leadtime <= 0) {
        window.alert("Please enter a valid lead time in seconds.")
        return
    }
    try {
        const res = await fetch("/api/time/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadtime })
        })
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (res.ok) {
            const data = await res.json()
            applyGameStatus(data)
            updateFullscreenCountdown(data)
        }
    } catch (err) {
        console.error("startGame failed:", err)
    }
}

async function stopGame() {
    try {
        const res = await fetch("/api/time/stop", { method: "POST" })
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (res.ok) {
            const data = await res.json()
            applyGameStatus(data)
        }
    } catch (err) {
        console.error("stopGame failed:", err)
    }
}

// ---- Devices --------------------------------------------------------------
function capabilityBadges(cap) {
    if (!cap) return ""
    const b = (label, on) => `<span class="badge ${on ? "on" : ""}">${label}</span>`
    return b("GPS", !!cap.gps) + b("CAM", !!cap.camera) + b("VIB", !!cap.vibrate)
}

function deviceCard(d) {
    const online = d.online
    const bat = d.battery ? `${d.battery.level}%${d.battery.charging ? " ⚡" : ""}` : "—"
    const hasPos = d.gps && typeof d.gps.latitude === "number"
    const card = document.createElement("div")
    card.className = "device-card"
    card.innerHTML = `
        <span class="dot ${online ? "online" : "offline"}"></span>
        <div class="device-main">
            <div class="device-id">${escapeHtml(shortId(d.deviceID))}</div>
            <div class="badges">${capabilityBadges(d.capabilities)}${hasPos ? '<span class="badge on">📍</span>' : ""}${d.streaming ? '<span class="badge warn">LIVE</span>' : ""}</div>
        </div>
        <span class="battery ${d.battery?.charging ? "charging" : ""}">${bat}</span>`
    card.addEventListener("click", () => openDevice(d))
    return card
}

function renderDeviceList(elId, list) {
    const el = $(elId)
    if (!list.length) {
        el.innerHTML = '<p class="empty">No devices connected</p>'
        return
    }
    el.innerHTML = ""
    list.forEach((d) => el.appendChild(deviceCard(d)))
}

function qrDeviceChip(d) {
    const cap = d.capabilities || {}
    const b = (label, on) => `<span class="badge ${on ? "on" : ""}">${label}</span>`
    const chip = document.createElement("div")
    chip.className = "qr-device-chip"
    chip.innerHTML = `
        <div class="device-main">
            <div class="device-id">${escapeHtml(shortId(d.deviceID))}</div>
            <div class="badges">
                ${b("GPS", !!cap.gps)}
                ${b("CAM", !!cap.camera)}
                ${b("VIB", !!cap.vibrate)}
                ${b("BAT", !!d.battery)}
            </div>
        </div>`
    chip.addEventListener("click", () => openDevice(d))
    return chip
}

function renderQrDeviceList(elId, list) {
    const el = $(elId)
    if (!el) return
    if (!list.length) {
        el.innerHTML = '<span class="empty">No devices yet</span>'
        return
    }
    el.innerHTML = ""
    list.forEach((d) => el.appendChild(qrDeviceChip(d)))
}

function renderTeamDeviceSummary() {
    const runner = devices.filter((d) => d.group === "runner")
    const catcher = devices.filter((d) => d.group === "catcher")

    $("runnerCount").innerHTML = `<b>${runner.length}</b> device${runner.length === 1 ? "" : "s"}`
    $("catcherCount").innerHTML = `<b>${catcher.length}</b> device${catcher.length === 1 ? "" : "s"}`
    $("runnerCountFull").innerHTML = `<b>${runner.length}</b> device${runner.length === 1 ? "" : "s"}`
    $("catcherCountFull").innerHTML = `<b>${catcher.length}</b> device${catcher.length === 1 ? "" : "s"}`

    renderQrDeviceList("runnerQrDevices", runner)
    renderQrDeviceList("catcherQrDevices", catcher)
    renderQrDeviceList("runnerQrDevicesFull", runner)
    renderQrDeviceList("catcherQrDevicesFull", catcher)
}

function renderDevices() {
    const runner = devices.filter((d) => d.group === "runner")
    const catcher = devices.filter((d) => d.group === "catcher")
    const other = devices.filter((d) => d.group !== "runner" && d.group !== "catcher")
    renderDeviceList("runnerDevices", runner)
    renderDeviceList("catcherDevices", catcher)
    renderDeviceList("unassignedDevices", other)
    renderTeamDeviceSummary()

    // keep the open modal in sync
    if (selectedDevice) {
        const fresh = devices.find((d) => d.deviceID === selectedDevice.deviceID)
        if (fresh) {
            selectedDevice = fresh
            fillModalInfo(fresh)
            syncStreamControls(fresh)
        }
    }
}

async function pollDevices() {
    try {
        const res = await fetch("/api/telemetry/list")
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (!res.ok) return
        const data = await res.json()
        if (!data.ok) return
        devices = data.devices || []
        renderDevices()
        updateMap()
    } catch (err) {
        console.error("pollDevices failed:", err)
    }
}

// ---- Map ------------------------------------------------------------------
function initMap() {
    if (typeof L === "undefined") {
        $("mapHint").textContent = "Map unavailable (no internet connection for map tiles)."
        $("map").classList.add("hidden")
        return
    }
    map = L.map("map").setView([0, 0], 2)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
    }).addTo(map)
    $("mapHint").textContent = "Only devices that reported a GPS position are shown."
}

function groupColor(group) {
    if (group === "runner") return "#9d8cf0"
    if (group === "catcher") return "#f08c9d"
    return "#8f86a8"
}

function updateMap() {
    if (!map) return
    const seen = new Set()
    for (const d of devices) {
        if (!d.gps || !d.online) continue
        if (typeof d.gps.latitude !== "number" || typeof d.gps.longitude !== "number") continue
        seen.add(d.deviceID)
        const pos = [d.gps.latitude, d.gps.longitude]
        const color = groupColor(d.group)
        const popup = `<b>${escapeHtml(shortId(d.deviceID))}</b><br>${escapeHtml(d.group || "unassigned")} · ${d.battery?.level ?? "?"}%`

        if (markers[d.deviceID]) {
            markers[d.deviceID].setLatLng(pos).setPopupContent(popup)
        } else {
            markers[d.deviceID] = L.circleMarker(pos, {
                radius: 9,
                color: "#050505",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.95
            }).addTo(map).bindPopup(popup)
        }
    }
    for (const id in markers) {
        if (!seen.has(id)) {
            map.removeLayer(markers[id])
            delete markers[id]
        }
    }
}

// ---- Photos ---------------------------------------------------------------
async function loadPhotos() {
    try {
        const res = await fetch("/api/image/all")
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (!res.ok) return
        const data = await res.json()
        if (!data.ok) return

        const grid = $("photosGrid")
        if (!data.images.length) {
            grid.innerHTML = '<p class="empty">No photos yet</p>'
            return
        }
        grid.innerHTML = ""
        for (const img of data.images) {
            const item = document.createElement("div")
            item.className = "photo-item"
            item.innerHTML = `<img loading="lazy" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.name)}"><div class="photo-day">${escapeHtml(img.day)}</div>`
            item.addEventListener("click", () => {
                $("lightboxImg").src = img.url
                $("lightbox").classList.remove("hidden")
            })
            grid.appendChild(item)
        }
    } catch (err) {
        console.error("loadPhotos failed:", err)
    }
}

// ---- Device modal + live stream ------------------------------------------
function fillModalInfo(d) {
    $("modalTitle").textContent = `Device ${shortId(d.deviceID)}`
    const gps = d.gps
    const gpsText = gps && typeof gps.latitude === "number"
        ? `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`
        : "no position"

    const cap = d.capabilities || {}
    const online = d.online ? "Online" : "Offline"
    const battery = d.battery
        ? `${d.battery.level}% ${d.battery.charging ? "(charging)" : ""}`
        : "unknown"

    $("modalInfo").innerHTML = `
        <p><b>ID:</b> ${escapeHtml(d.deviceID)}</p>
        <p><b>Status:</b> ${online} · ${d.age !== null ? Math.floor(d.age / 1000) + "s ago" : "never"}</p>
        <p><b>Team:</b> ${escapeHtml(d.group || "unassigned")}</p>
        <p><b>Battery:</b> ${escapeHtml(battery)}</p>
        <p><b>Position:</b> ${escapeHtml(gpsText)}</p>
        <p><b>Capabilities:</b> GPS ${cap.gps ? "✓" : "✗"} · Camera ${cap.camera ? "✓" : "✗"} · Vibrate ${cap.vibrate ? "✓" : "✗"}</p>`
}

function syncStreamControls(d) {
    const streaming = Boolean(d.streaming)
    $("streamStart").classList.toggle("hidden", streaming)
    $("streamStop").classList.toggle("hidden", !streaming)
    $("cameraEnv").classList.toggle("hidden", !streaming)
    $("cameraFace").classList.toggle("hidden", !streaming)
    if (!streaming) {
        $("streamImg").classList.add("hidden")
        $("streamPlaceholder").classList.remove("hidden")
    }
}

function openDevice(d) {
    selectedDevice = d
    fillModalInfo(d)
    syncStreamControls(d)
    if (d.streaming) {
        startFramePolling()
    } else {
        stopFramePolling()
    }
    $("deviceModal").classList.remove("hidden")

    // focus the map on this device when a position is known
    if (map && d.gps && typeof d.gps.latitude === "number") {
        map.setView([d.gps.latitude, d.gps.longitude], Math.max(map.getZoom(), 15))
        if (markers[d.deviceID]) markers[d.deviceID].openPopup()
    }
}

function closeDevice() {
    stopFramePolling()
    selectedDevice = null
    $("deviceModal").classList.add("hidden")
}

async function setStream(enabled, facing) {
    if (!selectedDevice) return
    try {
        const res = await fetch("/api/telemetry/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deviceID: selectedDevice.deviceID,
                enabled,
                facing
            })
        })
        if (res.status === 401) { window.location.href = "/admin"; return }
        if (res.ok) {
            if (enabled) {
                startFramePolling()
            } else {
                stopFramePolling()
            }
            // optimistic UI
            selectedDevice.streaming = enabled
            syncStreamControls(selectedDevice)
            pollDevices()
        }
    } catch (err) {
        console.error("setStream failed:", err)
    }
}

function startFramePolling() {
    stopFramePolling()
    pollFrame()
    streamPollTimer = setInterval(pollFrame, 500)
}

function stopFramePolling() {
    if (streamPollTimer) clearInterval(streamPollTimer)
    streamPollTimer = null
}

async function pollFrame() {
    if (!selectedDevice) return
    try {
        const res = await fetch(`/api/telemetry/stream/${encodeURIComponent(selectedDevice.deviceID)}/frame`, { cache: "no-store" })
        if (res.status === 204) return
        if (!res.ok) return
        const blob = await res.blob()
        if (!blob || blob.size === 0) return
        if (frameUrl) URL.revokeObjectURL(frameUrl)
        frameUrl = URL.createObjectURL(blob)
        const img = $("streamImg")
        img.src = frameUrl
        img.classList.remove("hidden")
        $("streamPlaceholder").classList.add("hidden")
    } catch (err) {
        // frame not available yet, keep polling
    }
}

// ---- Init -----------------------------------------------------------------
window.addEventListener("load", async () => {
    const ok = await ensureAuth()
    if (!ok) return

    tickClock()
    setInterval(tickClock, 1000)

    initMap()
    await loadTeams()
    await pollDevices()
    await loadPhotos()
    await pollGameStatus()

    setInterval(pollDevices, 3000)
    setInterval(loadPhotos, 30000)
    setInterval(pollGameStatus, 500)

    $("genCodesBtn").addEventListener("click", requestGenerateCodes)
    $("confirmOk").addEventListener("click", doGenerateCodes)
    $("confirmCancel").addEventListener("click", cancelGenerateCodes)
    $("confirmModal").addEventListener("click", (e) => {
        if (e.target === $("confirmModal")) cancelGenerateCodes()
    })

    $("startGameBtn").addEventListener("click", startGame)
    $("stopGameBtn").addEventListener("click", stopGame)
    $("setIntervalBtn").addEventListener("click", setIntervalTime)

    $("fullscreenQrBtn").addEventListener("click", () => $("qrFullscreen").classList.remove("hidden"))
    $("qrFullscreenClose").addEventListener("click", () => $("qrFullscreen").classList.add("hidden"))

    $("logoutBtn").addEventListener("click", () => {
        delCookie("adminPW")
        window.location.href = "/admin"
    })

    $("modalClose").addEventListener("click", closeDevice)
    $("deviceModal").addEventListener("click", (e) => {
        if (e.target === $("deviceModal")) closeDevice()
    })

    $("streamStart").addEventListener("click", () => setStream(true, "environment"))
    $("streamStop").addEventListener("click", () => setStream(false, "environment"))
    $("cameraEnv").addEventListener("click", () => setStream(true, "environment"))
    $("cameraFace").addEventListener("click", () => setStream(true, "face"))

    $("lightboxClose").addEventListener("click", () => $("lightbox").classList.add("hidden"))
    $("lightbox").addEventListener("click", (e) => {
        if (e.target === $("lightbox")) $("lightbox").classList.add("hidden")
    })

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeDevice()
            $("lightbox").classList.add("hidden")
            $("qrFullscreen").classList.add("hidden")
            cancelGenerateCodes()
        }
    })
})


