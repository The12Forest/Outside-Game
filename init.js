import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { gameGroups, setupSocket } from './Backend/routes/ws/index.js';
import log from './Backend/functions/log.js';
const console = { log: log('InitRouter') };



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const httpPort = process.env.PORT || 80;
const httpsPort = process.env.HTTPS_PORT || 443;

app.use(express.json(), express.urlencoded({ extended: true }), cookieParser());

// Routes
import { router as codeRouter       } from './Backend/routes/code/index.js';
import { router as adminRouter      } from './Backend/routes/admin/index.js';
import { router as imageRouter       } from './Backend/routes/image/index.js';
import { router as gameRouter       } from './Backend/routes/game/index.js';

app.use("/api/code",       codeRouter)
app.use("/api/admin",      adminRouter)
app.use("/api/image",      imageRouter)
//app.use("/api/time",       codeRouter)
//app.use("/api/main",       mainRouter)
//app.use("/api/task",       tasksRouter)
//app.use("/api/user",       userRouter)
//app.use("/api/storage",    adminRouter)
//app.use("/api/login",      loginRouter)
//app.use("/api/shutdown",   shutdownRouter)

// Static assets
app.use('/functions', express.static(path.join(__dirname, 'Frontend/functions')));
app.use('/game', express.static(path.join(__dirname, 'Frontend/game')));
app.use('/panel', express.static(path.join(__dirname, 'Frontend/Panel')));
app.use('/error', express.static(path.join(__dirname, 'Frontend/Error')));
app.use('/admin', express.static(path.join(__dirname, 'Frontend/Admin')));
app.use('/', express.static(path.join(__dirname, 'Frontend/Root')));

// Catch all
app.use((req, res) => { res.redirect('/'); });

// HTTP → HTTPS redirect
/*
http.createServer((req, res) => {
    const host = (req.headers.host || 'localhost').replace(/:\d+$/, ':' + httpsPort);
    if ((req.headers.host || 'localhost').startsWith('127.0.0.1') || (req.headers.host || 'localhost').startsWith('localhost') || req.socket.remoteAddress === '::1') {
        return;
    }
    res.writeHead(301, { Location: 'https://' + host + req.url });
    res.end();
}).listen(httpPort, () => console.log(`HTTP redirect on port ${httpPort}`));
*/

http.createServer(app).listen(httpPort, () => {
    console.log(`HTTP server on port ${httpPort}`);
});

// HTTPS server + Socket.io
const privateKey = fs.readFileSync('./Cert/key.pem', 'utf8');
const certificate = fs.readFileSync('./Cert/cert.pem', 'utf8');
const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);
const io = new Server(httpsServer);

// Socket
setupSocket(io);

httpsServer.listen(httpsPort, () => console.log(`HTTPS server on port ${httpsPort}`));

console.log('Outside Game Server started');
export default app;
