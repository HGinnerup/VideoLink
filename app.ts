import express from "express";
import ws from "ws";


const videoFilePath = "";


const app = express()

app.get("/movie", (request, response) => {
    response.sendFile(videoFilePath);
});

app.use(express.static("public"))


const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
//   socket.on('message', message => console.log(message));
});

const server = app.listen(3000)


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



