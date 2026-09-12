import express from "express"
import fs from 'fs';
import path from "path";
import crypto from "crypto";
import { resetNextDeadline } from "../time/index.js";
import { fileURLToPath } from 'url';
import log from '../../functions/log.js';
const console = { log: log('GameRouter') };
const router = express.Router()
let logPrefix = 'GameRouter'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const imagesDir = path.join(__dirname, '..', '..', '..', 'Images');
fs.mkdirSync(imagesDir, { recursive: true });

const pad = (n) => String(n).padStart(2, '0');


function dayStamp(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


function timeStamp(d = new Date()) {
    return `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}


const MIME_EXT = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/avif': 'avif'
};

const EXT_MIME = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'heic': 'image/heic',
    'avif': 'image/avif'
};

const latestFile = path.join(imagesDir, '.latest.json');

function newImageId() {
    return crypto.randomUUID();
}

async function saveImage(buffer, ext, id) {
    const day = dayStamp();
    const dayDir = path.join(imagesDir, day);
    await fs.promises.mkdir(dayDir, { recursive: true });

    const base = timeStamp();
    let name = `${base}.${ext}`;
    let i = 1;
    while (fs.existsSync(path.join(dayDir, name))) {
        name = `${base}-${i++}.${ext}`;
    }

    await fs.promises.writeFile(path.join(dayDir, name), buffer);
    return { id, file: `${day}/${name}`, size: buffer.length, time: Date.now() };
}

async function setLatestImage(meta) {
    await fs.promises.writeFile(latestFile, JSON.stringify(meta), 'utf8');
}

async function getLatestImage() {
    try {
        const meta = JSON.parse(await fs.promises.readFile(latestFile, 'utf8'));
        if (!meta || !meta.id || !meta.file) return null;

        const absPath = path.join(imagesDir, meta.file);
        if (!fs.existsSync(absPath)) return null;

        return { ...meta, absPath };
    } catch {
        return null;
    }
}


const rawImage = express.raw({ type: 'image/*', limit: '50mb' });


let games = []
let settings = []
let codesA = []
let codesB = []

// router.use("/save", (req, res) => {
//     let buffer = JSON.stringify(passwords)
//     fs.writeFileSync("./Backend/saves/passwords.json", buffer)
//     buffer = JSON.stringify(admin_usernames)
//     fs.writeFileSync("./Backend/saves/admin_usernames.json", buffer)
//     // console.log(logprefix + "Usernames saved:     " + JSON.stringify(admin_usernames))
//     console.log(logprefix + "Username saved:      " + '["Hidden"]')
//     //   console.log(logprefix + "Passwords saved:     " + JSON.stringify(passwords))
//     console.log(logprefix + "Passwords saved:     " + '["Hidden"]')
//     res.send("Passwords Saved")
// })

// router.use("/load", (req, res) => {
//     passwords = JSON.parse(fs.readFileSync("./Backend/saves/passwords.json"))
//     admin_usernames = JSON.parse(fs.readFileSync("./Backend/saves/admin_usernames.json"))
//     passwordreset = JSON.parse(fs.readFileSync("./Backend/saves/admin_usernames.json"))
//     // console.log(logprefix + "Passwordresets loaded:  " + JSON.stringify(admin_usernames))
//     console.log(logprefix + "Usernames loaded:     " + '["Hidden"]')
//     // console.log(logprefix + "Passwords loaded:  " + JSON.stringify(passwords))
//     console.log(logprefix + "Passwords loaded:     " + '["Hidden"]')
//     res.send("Passwords loaded")
// })


router.post("/post", rawImage, async (req, res) => {
    const mime = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();

    if (!mime.startsWith('image/')) {
        return res.status(400).json({ ok: false, error: "Content-Type must be image/*" })
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ ok: false, error: "no image received" })
    }

    try {
        const id = newImageId();
        const saved = await saveImage(req.body, MIME_EXT[mime] || 'jpg', id);
        await setLatestImage({ id: saved.id, file: saved.file, size: saved.size, time: saved.time });
        console.log("Image saved:         " + saved.file + " id=" + saved.id + " (" + saved.size + " bytes)")
        res.status(200).json({ ok: true, id: saved.id, file: saved.file, size: saved.size })
        resetNextDeadline()
    } catch (err) {
        console.log("Save error:          " + err.message)
        res.status(500).json({ ok: false, error: "could not save image" })
    }
})


router.get("/latest", async (req, res) => {
    try {
        const latest = await getLatestImage();

        if (!latest) {
            return res.status(404).json({ ok: false, error: "no image available" })
        }

        const reqId = (req.query.id || req.headers['x-image-id'] || '').toString().trim();

        if (reqId && reqId === latest.id) {
            return res.status(200).json({ ok: false, id: latest.id, reason: "already up to date" })
        }

        if (req.query.info === 'true' || req.query.info === '1') {
            res.setHeader('X-Image-Id', latest.id);
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json({
                ok: true,
                id: latest.id,
                file: latest.file,
                size: latest.size,
                time: latest.time
            })
        }

        const ext = (latest.file.split('.').pop() || '').toLowerCase();

        res.setHeader('Content-Type', EXT_MIME[ext] || 'application/octet-stream');
        res.setHeader('Content-Length', latest.size);
        res.setHeader('X-Image-Id', latest.id);
        res.setHeader('Cache-Control', 'no-store');

        const buffer = await fs.promises.readFile(latest.absPath);
        console.log("Image served:        " + latest.id + " (" + latest.size + " bytes)")
        res.status(200).send(buffer)
    } catch (err) {
        console.log("Read error:          " + err.message)
        res.status(500).json({ ok: false, error: "could not read image" })
    }
})

router.use((err, req, res, next) => {
    console.log("Upload error:        " + err.message)
    res.status(err.status || 400).json({ ok: false, error: err.message })
})






router.use("", (req, res) => res.status(404).json({ error: "not found" }))
export { router }