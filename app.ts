import express from "express";
import * as fs from "fs";
import https from "https"
import ws from "ws";
import * as os from "os"
import * as path from "path"


const videoFilePath = "";

const homedir = os.homedir();
const httpKeyPath = path.join(homedir, "ssl/key.pem");
const httpCertPath = path.join(homedir, "ssl/cert.pem");

const app = express()

const server = https.createServer({
    key: fs.readFileSync(httpKeyPath),
    cert: fs.readFileSync(httpCertPath)
}, app)

app.get("/movie", (request, response) => {
    response.sendFile(videoFilePath);
});

app.use(express.static("public"))


const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
//   socket.on('message', message => console.log(message));
});

server.listen(3000);


let nextClientId = 1;
const clients:{ [id: number] : ws.WebSocket; } = {};

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});

wsServer.on("connection", (socket) => {
    let id:number = nextClientId++;

    clients[id] = socket;

    socket.on("message", (data) => {

        let message = data.toString();

        for(let i in clients) {
            let otherSocket = clients[i];
            if(otherSocket == socket)
                continue;

            otherSocket.send(message);
        }
    })

    socket.on("close", () => {
        delete clients[id];
    });
});



