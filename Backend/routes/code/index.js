import express from "express"
import fs from 'fs';
import path from "path";
import log from '../../functions/log.js';
const console = { log: log('CodeRouter') };
const router = express.Router()
let active_code = [123]

router.get("/check", async (req, res) => {
    let code = req.query.code ?? req.params.code ?? req.body.code
    let codeID = active_code.indexOf(Number(code))
    if (codeID != -1) {
        res.cookie('code', code, {
            maxAge: 240000,
            secure: true,  
            sameSite: 'lax'
        });
        res.status(200).json({ ok: true, Reason: "Code Correct!" })
    } else {
        res.status(401).json({ ok: false, Reason: "Code Wrong!" })
    }
})


export { router }

