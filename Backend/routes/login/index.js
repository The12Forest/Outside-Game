import express from "express"
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import log from '../../functions/log.js';
const console = { log: log('LoginRouter') };
const router = express.Router()
l


router.get("/join/:code", async (req, res) => {
    let resp = await fetch("http://127.0.0.1/api/game/" + req.params.id)
    resp = await JSON(resp)
    if (resp.Okay) {
        if (resp.teamA) {
            res.status(200).json({"Okay": true, "team": "A"})
        } else if (resp.teamB) {
            res.status(200).json({ "Okay": true, "team": "B" })
        } else {
            res.status(400).json({"Okayay": false, "Reason": "No team found!"})
        }
    } else {
        res.status(400).json({"Okayay": false, "Reason": "No team found!"})
    }
})