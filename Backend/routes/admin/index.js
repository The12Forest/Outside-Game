import express from "express"
import log from '../../functions/log.js';
import { adminPasswd, adminAuth } from '../../functions/auth.js';
const console = { log: log('AdminRouter') };
const router = express.Router()

router.post("/check", async (req, res) => {
    if (req.body?.password === adminPasswd()) {
        res.status(200).json({ "ok": true, "Reason": "Password Correct!" })
    } else {
        res.status(401).json({ "ok": false, "Reason": "Password Wrong!" })
    }
})

// Validates the stored adminPW cookie server side.
router.get("/session", adminAuth, async (req, res) => {
    res.status(200).json({ ok: true })
})


export { router }

