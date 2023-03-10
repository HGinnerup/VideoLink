const client = new WebSocket(`wss://${location.host}`);

client.onOpen = () => { };

function clientSend(action, data) {
    client.send(JSON.stringify({"action": action, "data": data}));
}

const video = document.querySelector("video");
let doingSyncedAction = false;
let doingSyncedActionTimer;

client.actionListener = new EventTarget();

client.addEventListener("message", (event) => {
    console.log("Recieved: ", event);
    doingSyncedAction = true;
    try {
        const socketPackage = JSON.parse(event.data);
        console.log(socketPackage);

        event = new Event(socketPackage.action);
        event.data = socketPackage.data;
        client.actionListener.dispatchEvent(event);
    }
    catch(err) {
        console.error("Unhandled socket message: ", err);
    }

    clearTimeout(doingSyncedActionTimer);
    doingSyncedActionTimer = setTimeout(() => {doingSyncedAction = false;}, 300)
});

client.actionListener.addEventListener("play", (data) => {
    video.currentTime = data.currentTime;
    video.play();
});

client.actionListener.addEventListener("seek", (data) => {
    video.currentTime = data.currentTime;
});

client.actionListener.addEventListener("pause", (data) => {
    video.pause();
});

client.actionListener.addEventListener("ping", (data) => {
    clientSend("pong", {})
});



video.onplay = () => {
    if(doingSyncedAction) return;
    clientSend("play", {currentTime: video.currentTime});
}

video.onseeked = () => {
    if(doingSyncedAction) return;
    clientSend("seek", {currentTime: video.currentTime});
}

video.onpause = () => {
    if(doingSyncedAction) return;
    clientSend("pause", {});
}





