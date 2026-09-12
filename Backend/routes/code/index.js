import express from "express"
import fs from 'fs';
import path from "path";
import log from '../../functions/log.js';
const console = { log: log('CodeRouter') };
const router = express.Router()
let active_code = [123, 456]
//first code is runner seccond code is catcher

function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function codeGet(req, res) {
    let code = req.query.code ?? req.params.code ?? req.body.code
    let codeID = active_code.indexOf(Number(code))
    if (codeID != -1) {
        res.cookie('code', code, {
            maxAge: (5 * 60 * 60 * 1000),
            secure: true,
            sameSite: 'lax'
        });



        if (!(codeID % 2)) {
            res.cookie('group', "runner", {
                maxAge: (5 * 60 * 60 * 1000),
                secure: true,
                sameSite: 'lax'
            });
            res.status(200).json({ ok: true, Group: "Runner", Reason: "Code Correct!" })
        } else {
            res.cookie('group', "catcher", {
                maxAge: (5 * 60 * 60 * 1000),
                secure: true,
                sameSite: 'lax'
            });
            res.status(200).json({ ok: true, Group: "Catcher", Reason: "Code Correct!" })
        }
    } else {
        res.status(401).json({ ok: false, Reason: "Code Wrong!" })
    }
}

router.get("/check", codeGet)
router.get("/group", codeGet)

function codeTeam(code) {
    const codeID = active_code.indexOf(Number(code))
    if (codeID === -1) return null
    return !(codeID % 2) ? "runner" : "catcher"
}


router.get("/newteam", async (req, res) => {
    let code_runner  = makeid(4)
    let code_catcher = makeid(4)
    while (code_catcher == code_runner) {
        let code_catcher = makeid(4)
    }
    active_code.push(code_runner)
    active_code.push(code_catcher)

    res.cookie('code_runner', code_runner, {
        maxAge: (5 * 60 * 60 * 1000),
        secure: true,
        sameSite: 'lax'
    });
    res.cookie('code_catcher', code_catcher, {
        maxAge: (5 * 60 * 60 * 1000),
        secure: true,
        sameSite: 'lax'
    });

    res.status(200).json({ ok: true, runner: code_runner, catcher: code_catcher })
})



export { router, codeTeam }

