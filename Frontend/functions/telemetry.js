const telemetry_url = "/api/telemetry"
let telemetry_interval
let telemetry_busy = false
let currentDeviceId = null

function getDeviceId() {
    if (currentDeviceId) return currentDeviceId
    if (typeof getCookie === "function") {
        const fromCookie = getCookie("deviceID")
        if (fromCookie) return fromCookie
    }
    return null
}

function getCapabilities() {
    return {
        gps: 'geolocation' in navigator,
        camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        vibrate: 'vibrate' in navigator
    }
}

async function getTelemetry() {
    let battery = null
    if ('getBattery' in navigator) {
        try {
            const b = await navigator.getBattery()
            battery = {
                level: Math.round(b.level * 100),
                charging: b.charging,
                chargingTime: b.chargingTime,
                dischargingTime: b.dischargingTime
            }
        } catch (err) {
            console.error("Battery read failed:", err)
        }
    } else {
        console.warn("Battery Status API is not supported in this browser.")
    }

    let gps = null
    if ('geolocation' in navigator) {
        try {
            gps = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { coords, timestamp } = position
                        resolve({
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            accuracy: coords.accuracy,
                            altitude: coords.altitude,
                            speed: coords.speed,
                            heading: coords.heading,
                            timestamp: timestamp
                        })
                    },
                    reject,
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                )
            })
        } catch (err) {
            console.error("GPS read failed:", err)
        }
    } else {
        console.warn("Geolocation is not supported in this browser.")
    }

    return { battery, gps, capabilities: getCapabilities() }
}

async function sendTelemetry() {
    if (telemetry_busy) return
    telemetry_busy = true
    try {
        const response = await fetch(telemetry_url + "/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(await getTelemetry())
        })
        if (!response.ok) {
            console.warn("Telemetry send failed:", response.status)
            return
        }
        try {
            const data = await response.json()
            if (data?.deviceID) currentDeviceId = data.deviceID
        } catch (err) {
            // ignore malformed response
        }
    } catch (err) {
        console.error("Telemetry send failed:", err)
    } finally {
        telemetry_busy = false
    }
}

function startTelemetry(interval) {
    sendTelemetry()
    telemetry_interval = setInterval(sendTelemetry, interval)
}

function stopTelemetry() {
    clearInterval(telemetry_interval)
    telemetry_interval = undefined
}