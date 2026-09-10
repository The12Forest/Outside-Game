import express from "express"
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import log from '../../functions/log.js';
const console = { log: log('GameRouter') };
const router = express.Router()
let logPrefix = 'GameRouter'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Images/ lives in the project root: Backend/routes/image -> ../../../Images
const imagesDir = path.join(__dirname, '..', '..', '..', 'Images');
fs.mkdirSync(imagesDir, { recursive: true });

const pad = (n) => String(n).padStart(2, '0');

// Folder name: YYYY-MM-DD
function dayStamp(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// File base name: HH-MM-SS (local time)
function timeStamp(d = new Date()) {
    return `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

// Maps the request's Content-Type to a file extension.
const MIME_EXT = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/avif': 'avif'
};

// Writes the buffer to Images/<YYYY-MM-DD>/<HH-MM-SS>.<ext>, adding -1, -2, ...
// if a photo with the same timestamp already exists.
async function saveImage(buffer, ext) {
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
    return `${day}/${name}`;
}

// Accepts a raw image body (Content-Type: image/*), not multipart.
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
        const relPath = await saveImage(req.body, MIME_EXT[mime] || 'jpg');
        console.log("Image saved:         " + relPath + " (" + req.body.length + " bytes)")
        res.status(200).json({ ok: true, file: relPath, size: req.body.length })
    } catch (err) {
        console.log("Save error:          " + err.message)
        res.status(500).json({ ok: false, error: "could not save image" })
    }
})

router.use((err, req, res, next) => {
    console.log("Upload error:        " + err.message)
    res.status(err.status || 400).json({ ok: false, error: err.message })
})






router.use("", (req, res) => res.status(404).json({ error: "not found" }))
export { router }