import express from "express";
import * as zlib from "zlib"
import * as fs from "fs";
import https from "https"
import ws from "ws";
import * as os from "os"
import * as path from "path"
import compression from "compression";
import * as fileUtil from "./util/fileUtil"

const srtVtt = require("srt-to-vtt");

const resourceDirectory = path.resolve("./resources")

let videoFilePath: string | null = null;
let captionsFilePath: string | null = null;

const homedir = os.homedir();
const httpKeyPath = path.join(homedir, "ssl/key.pem");
const httpCertPath = path.join(homedir, "ssl/cert.pem");

const app = express()

app.use(compression({
    level: zlib.constants.Z_BEST_COMPRESSION,
    memLevel: zlib.constants.Z_MAX_MEMLEVEL,
    strategy: zlib.constants.Z_HUFFMAN_ONLY,
    filter: () => true
}));
app.use(express.json());

const server = https.createServer({
    key: fs.readFileSync(httpKeyPath),
    cert: fs.readFileSync(httpCertPath)
}, app)

app.get("/movie", (request, response) => {
    if(videoFilePath === null) {
        response.status(404)
        response.end()
        return;
    }

    response.sendFile(videoFilePath);
});

app.get("/captions", async (request, response) => { 
    try {
        if(captionsFilePath === null || !fs.existsSync(captionsFilePath)) {
            response.status(404)
            response.end("Captions not found")
            return;
        }

        fs.createReadStream(captionsFilePath).pipe(srtVtt()).pipe(response);
    }
    catch(err) {
        response.status(505)
        response.end(String(err))
    }
});

app.post("/set-resource", async (request, response) => {
    // @ts-ignore
    if(request.client.address().address !== "::1"){
        response.status(403)
        response.send(`Only host can change files`);
        return
    }


    let searchedFileName = request.body["filename"]
    let foundFileName = await fileUtil.search(resourceDirectory, async (name, stats) =>
        path.basename(name) === searchedFileName
    )

    if(foundFileName === null) {
        response.status(404)
        response.send(`File ${searchedFileName} not found.`);
        return
    }

    // @ts-ignore
    let mimeType:string = express.static.mime.types[path.extname(foundFileName).substr(1)]

    let mimeMainType = mimeType.split("/")[0]
    if(mimeMainType === "video")
        videoFilePath = foundFileName;
    else if(mimeType === "application/x-subrip")
        captionsFilePath = foundFileName

    response.status(200)
    response.send("Success");
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



