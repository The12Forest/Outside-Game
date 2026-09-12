import express from "express"
import log from '../../functions/log.js';
import { adminAuth } from '../../functions/auth.js';
const console = { log: log('TimeRouter') };
const router = express.Router()

let positonReadable = false
let gameState = "waiting" // "waiting" | "running"
let intervalMs = 5 * 60 * 1000   // countdown length after each photo (seconds -> ms)
let leadtimeMs = 5 * 60 * 1000   // initial lead time when the admin starts the game
let deadline = Date.now() + intervalMs


function setIntervalMs(ms, restart = false) {
    const value = Number(ms)

    if (!value || value <= 0) return null

    intervalMs = value
    if (restart) deadline = Date.now() + intervalMs
    return intervalMs
}

function resetNextDeadline() {
    // Only extend the countdown while a game is actually running.
    if (gameState !== "running") return
    deadline = Date.now() + intervalMs
    console.log("deadline reset")
}

function getStatus() {
    return {
        ok: true,
        state: gameState,
        deadline: deadline,
        leadtime: leadtimeMs,
        interval: intervalMs,
        serverTime: Date.now()
    }
}

router.get("/now", (req, res) => {
    res.status(200).json({ ok: true, serverTime: Date.now() })
})

router.get("/deadline", (req, res) => {
    res.status(200).json(getStatus())
})

router.get("/status", (req, res) => {
    res.status(200).json(getStatus())
})

// Admin: start a new game with a lead time (seconds) for the runner
router.post("/start", adminAuth, (req, res) => {
    const leadtime = Number(req.body?.leadtime ?? req.query?.leadtime)
    if (!leadtime || leadtime <= 0) {
        return res.status(400).json({ ok: false, Reason: "leadtime (seconds) required" })
    }

    leadtimeMs = leadtime * 1000
    deadline = Date.now() + leadtimeMs
    gameState = "running"
    positonReadable = false

    console.log(`Game started with leadtime ${leadtime}s (interval stays ${intervalMs / 1000}s)`)
    res.status(200).json(getStatus())
})

// Admin: set the countdown interval (seconds) used after each photo
router.post("/interval", adminAuth, (req, res) => {
    const interval = Number(req.body?.interval ?? req.query?.interval)
    if (!interval || interval <= 0) {
        return res.status(400).json({ ok: false, Reason: "interval (seconds) required" })
    }

    intervalMs = interval * 1000

    console.log(`Interval set to ${interval}s`)
    res.status(200).json(getStatus())
})

// Admin: stop / reset the game
router.post("/stop", adminAuth, (req, res) => {
    gameState = "waiting"
    positonReadable = false

    console.log("Game stopped")
    res.status(200).json(getStatus())
})

setInterval(() => {
    if (gameState === "running" && deadline < Date.now()) {
        positonReadable = true
    } else {
        positonReadable = false
    }
}, 1000);


export { router, setIntervalMs, resetNextDeadline, positonReadable, gameState }
