import express from "express"
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import log from '../../functions/log.js';
const console = { log: log('AdminRouter') };
const router = express.Router()
const passwd = process.env.passwd || "123ict"

router.post("/check", async (req, res) => {
    console.log(req.body.password)
    if (req.body.password == passwd) {
        res.status(200).json({"ok": true, "Reason": "Password Correct!"})
    } else {
        res.status(401).json({"ok": false, "Reason": "Password Wrong!"})
    }
})


export { router }

