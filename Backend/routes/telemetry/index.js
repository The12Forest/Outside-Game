import express from "express"
import log from '../../functions/log.js';
import { positonReadable } from '../time/index.js';
import { codeTeam } from '../code/index.js';
const console = { log: log('TelemetryRouter') };
const router = express.Router()

let device_ids = []
let group = []
let gps_data = []   
let battery_data = []
let last_packet = []

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
    last_packet.push(null)
    return device_ids.length - 1
}

function removeDevice(index) {
    if (index < 0) return false
    device_ids.splice(index, 1)
    group.splice(index, 1)
    gps_data.splice(index, 1)
    battery_data.splice(index, 1)
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
    last_packet[index] = now

    console.log(`Packet from ${deviceID}:`, JSON.stringify(req.body))
    res.status(200).json({ ok: true, deviceID: deviceID, lastPacket: now })
})

router.get("/list", async (req, res) => {
    res.status(200).json({
        ok: true,
        devices: device_ids.map((deviceID, i) => ({
            deviceID,
            group: group[i],
            battery: battery_data[i],
            gps: gps_data[i],
            lastPacket: last_packet[i],
            online: isOnline(i),
            age: last_packet[i] === null ? null : Date.now() - last_packet[i]
        }))
    })
})

router.get("/device/:deviceID", async (req, res) => {
    const index = deviceIndex(req.params.deviceID)
    if (index === -1) {
        return res.status(404).json({ ok: false, Reason: "Unknown device" })
    }
    res.status(200).json({
        ok: true,
        deviceID: device_ids[index],
        group: group[index],
        battery: battery_data[index],
        gps: gps_data[index],
        lastPacket: last_packet[index],
        online: isOnline(index),
        age: last_packet[index] === null ? null : Date.now() - last_packet[index]
    })
})

router.delete("/device/:deviceID", async (req, res) => {
    const index = deviceIndex(req.params.deviceID)
    if (index === -1) {
        return res.status(404).json({ ok: false, Reason: "Unknown device" })
    }
    removeDevice(index)
    console.log("Device removed: " + req.params.deviceID)
    res.status(200).json({ ok: true, removed: req.params.deviceID })
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


export { router, avgpossition, device_ids, group, gps_data, battery_data, last_packet }

