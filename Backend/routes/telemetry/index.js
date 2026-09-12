import express from "express"
import log from '../../functions/log.js';
import { positonReadable } from '../time/index.js';
import { codeTeam } from '../code/index.js';
import { adminAuth } from '../../functions/auth.js';
const console = { log: log('TelemetryRouter') };
const router = express.Router()

let device_ids = []
let group = []
let gps_data = []   
let battery_data = []
let capabilities_data = []
let last_packet = []

// Live stream sessions keyed by deviceID
let streams = {}

const HEARTBEAT_TIMEOUT = 60 * 1000

function makeid(length) {
    var result = '';
    var characters = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789-';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function deviceIndex(deviceID) {
    return device_ids.indexOf(deviceID)
}

function addDevice(deviceID) {
    device_ids.push(deviceID)
    group.push(null)
    gps_data.push(null)
    battery_data.push(null)
    capabilities_data.push(null)
    last_packet.push(null)
    return device_ids.length - 1
}

function removeDevice(index) {
    if (index < 0) return false
    device_ids.splice(index, 1)
    group.splice(index, 1)
    gps_data.splice(index, 1)
    battery_data.splice(index, 1)
    capabilities_data.splice(index, 1)
    last_packet.splice(index, 1)
    return true
}

function isOnline(index) {
    return last_packet[index] !== null && (Date.now() - last_packet[index]) < HEARTBEAT_TIMEOUT
}


router.post("/data", async (req, res) => {
    let deviceID = req.cookies?.deviceID
    let index = deviceID ? deviceIndex(deviceID) : -1

    if (index === -1) {
        deviceID = deviceID || makeid(32)
        index = addDevice(deviceID)
        res.cookie('deviceID', deviceID, {
            maxAge: (999 * 60 * 60 * 1000),
            secure: true,
            sameSite: 'lax'
        })
        console.log("New device registerd: " + deviceID)
    }

    const now = Date.now()

    group[index] = codeTeam(req.cookies?.code) ?? req.cookies?.group ?? group[index]
    if (req.body?.battery) battery_data[index] = req.body.battery
    if (req.body?.gps) gps_data[index] = req.body.gps
    if (req.body?.capabilities) capabilities_data[index] = req.body.capabilities
    last_packet[index] = now

    console.log(`Packet from ${deviceID}:`, JSON.stringify(req.body))
    res.status(200).json({ ok: true, deviceID: deviceID, lastPacket: now })
})

function devicePublic(i) {
    return {
        deviceID: device_ids[i],
        group: group[i],
        battery: battery_data[i],
        gps: gps_data[i],
        capabilities: capabilities_data[i],
        lastPacket: last_packet[i],
        online: isOnline(i),
        age: last_packet[i] === null ? null : Date.now() - last_packet[i],
        streaming: Boolean(streams[device_ids[i]]?.enabled)
    }
}

router.get("/list", adminAuth, async (req, res) => {
    res.status(200).json({
        ok: true,
        devices: device_ids.map((deviceID, i) => devicePublic(i))
    })
})

router.get("/device/:deviceID", adminAuth, async (req, res) => {
    const index = deviceIndex(req.params.deviceID)
    if (index === -1) {
        return res.status(404).json({ ok: false, Reason: "Unknown device" })
    }
    res.status(200).json({ ok: true, ...devicePublic(index) })
})

router.delete("/device/:deviceID", adminAuth, async (req, res) => {
    const index = deviceIndex(req.params.deviceID)
    if (index === -1) {
        return res.status(404).json({ ok: false, Reason: "Unknown device" })
    }
    removeDevice(index)
    delete streams[req.params.deviceID]
    console.log("Device removed: " + req.params.deviceID)
    res.status(200).json({ ok: true, removed: req.params.deviceID })
})

// --- Live stream control (HTTP polling based, no websockets) -----------------

// Admin: start/stop or switch camera of a device stream
router.post("/stream", adminAuth, async (req, res) => {
    const deviceID = req.body?.deviceID
    const index = deviceID ? deviceIndex(deviceID) : -1
    if (index === -1) {
        return res.status(404).json({ ok: false, Reason: "Unknown device" })
    }

    const facing = (req.body?.facing === "face" || req.body?.facing === "user") ? "user" : "environment"
    const enabled = req.body?.enabled !== false
    const existing = streams[deviceID]

    streams[deviceID] = {
        facing,
        enabled,
        lastFrameTime: existing?.lastFrameTime ?? 0,
        frame: existing?.frame ?? null,
        contentType: existing?.contentType ?? "image/jpeg"
    }

    res.status(200).json({ ok: true, deviceID, requested: enabled, facing })
})

// Device: poll whether it should currently stream, and with which camera
router.get("/stream/status", async (req, res) => {
    const deviceID = req.cookies?.deviceID
    const stream = deviceID ? streams[deviceID] : null
    if (!stream || !stream.enabled) {
        return res.status(200).json({ requested: false })
    }
    res.status(200).json({ requested: true, facing: stream.facing })
})

const rawFrame = express.raw({ type: 'image/*', limit: '5mb' })

// Device: upload a single captured frame
router.post("/stream/frame", rawFrame, async (req, res) => {
    const deviceID = req.cookies?.deviceID
    const stream = deviceID ? streams[deviceID] : null
    if (!stream || !stream.enabled) {
        return res.status(409).json({ ok: false, Reason: "No active stream" })
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ ok: false, Reason: "no frame received" })
    }
    stream.frame = req.body
    stream.contentType = (req.headers['content-type'] || 'image/jpeg').split(';')[0].trim().toLowerCase()
    stream.lastFrameTime = Date.now()
    res.status(200).json({ ok: true })
})

// Admin: fetch latest frame for a device
router.get("/stream/:deviceID/frame", adminAuth, async (req, res) => {
    const stream = streams[req.params.deviceID]
    if (!stream || !stream.frame) {
        return res.status(204).end()
    }
    res.setHeader('Content-Type', stream.contentType)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Frame-Time', String(stream.lastFrameTime))
    res.status(200).send(stream.frame)
})

function avgpossition(teamID) {
    let newest = -1

    for (let i = 0; i < device_ids.length; i++) {
        if (group[i] !== teamID) continue
        if (!isOnline(i)) continue
        if (!gps_data[i]) continue

        if (newest === -1 || last_packet[i] > last_packet[newest]) {
            newest = i
        }
    }

    if (newest === -1) {
        return { ok: false, Reason: "No online positions for this team" }
    }

    const gps = gps_data[newest]

    return {
        ok: true,
        team: teamID,
        latitude: gps.latitude,
        longitude: gps.longitude,
        altitude: gps.altitude ?? 0, 
        time: last_packet[newest]
    }
}

router.get("/position", async (req, res) => {
    if (positonReadable) {
        res.status(200).json({ ok: true, gps: avgpossition("runner") })
    } else {
        res.status(401).json({ok: false, Reason: "You dont have premission to read that, yet!"})
    }
})


export { router, avgpossition, device_ids, group, gps_data, battery_data, capabilities_data, streams, last_packet }

