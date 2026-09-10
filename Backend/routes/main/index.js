import express from "express"
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import log from '../../functions/log.js';
const console = { log: log('MainRouter') };
const router = express.Router()
const baseurl = "http://127.0.0.1:80/api/"
const allDestinations = ["login", "game"]

router.get("/save", async (req, res) => {
    try {
        const response = await Promise.all(
            allDestinations.map(async (element) => {
                const temp = await fetch(baseurl + element);
                return await temp.json();
            })
        );

        res.status(200).json({ Okay: true, reason: response });
    } catch (err) {
        res.status(400).json({
            Okay: false,
            Reason: "There was an error in preparing that response!"
        });
    }
});

export { router }