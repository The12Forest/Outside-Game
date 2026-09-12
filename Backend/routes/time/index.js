import express from "express"
import log from '../../functions/log.js';
const console = { log: log('TimeRouter') };
const router = express.Router()

let positonReadable = true
let intervalMs = 5 * 60 * 1000
let deadline = Date.now() + intervalMs


function setIntervalMs(ms, restart = false) {
    const value = Number(ms)

    if (!value || value <= 0) return null

    intervalMs = value
    if (restart) deadline = Date.now() + intervalMs
    return intervalMs
}

function resetNextDeadline() { deadline = Date.now() + intervalMs; console.log("deadline reset") }

router.get("/now", (req, res) => {
    res.status(200).json({ ok: true, serverTime: Date.now() })
})

router.get("/deadline", (req, res) => {
    const serverTime = Date.now()
    res.status(200).json({ ok: true, deadline: deadline, serverTime })
})

// router.get("/reset", (req, res) => {
//     resetNextDeadline()
//     res.status(200).json({ ok: true })
// })

setInterval(() => {
    if (deadline < Date.now()) { 
        positonReadable = true
    } else {
        positonReadable = false; 
    }
}, 1000);


export { router, setIntervalMs, resetNextDeadline, positonReadable}
