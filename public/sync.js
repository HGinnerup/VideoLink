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

client.actionListener.addEventListener("play", (event) => {
    console.log("play", event.data)
    video.currentTime = event.data.currentTime;
    video.play();
});

client.actionListener.addEventListener("seek", (event) => {
    video.currentTime = event.data.currentTime;
});

client.actionListener.addEventListener("pause", (event) => {
    video.pause();
});

client.actionListener.addEventListener("ping", (event) => {
    clientSend("pong", {})
});

client.actionListener.addEventListener("getTime", (event) => {
    clientSend("currentTime", {
        currentTime: video.currentTime,
        isPlaying: video.currentTime>0 && !video.paused && !video.ended
    })
});

function syncJoin() {
    function join(event) {
        video.currentTime = event.data.currentTime;
        if(event.data.isPlaying)
            video.play();
        else 
            video.pause();

        client.actionListener.removeEventListener("currentTime", join);
    };

    clientSend("getTime");
    client.actionListener.addEventListener("currentTime", join);
}


function onFirstPlay(event) {
    syncJoin();
    subscribeVideoEvents();
    event.preventDefault();
    video.removeEventListener("play", onFirstPlay);
    return false;
}
video.addEventListener("play", onFirstPlay);


function subscribeVideoEvents() {
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
}





