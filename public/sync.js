const client = new WebSocket(`wss://${location.host}`);

client.onOpen = () => { };


const video = document.querySelector("video");
let doingSyncedAction = false;

client.addEventListener("message", (event) => {
    console.log("Recieved: ", event);
    doingSyncedAction = true;

    try {
        const data = JSON.parse(event.data);
        console.log(data);

        switch(data.action) {
            case "play":
                video.play();
                video.currentTime = data.currentTime
                break;

            case "seek":
                video.currentTime = data.currentTime
                break;

            case "pause":
                video.pause();
                break;
        }
    }
    catch(err) {

    }

    setTimeout(() => {doingSyncedAction = false;}, 300)
    
});

video.onplay = () => {
    if(doingSyncedAction) return;
    client.send(JSON.stringify({"action": "play", currentTime: video.currentTime}));
}

video.onseeked = () => {
    if(doingSyncedAction) return;
    client.send(JSON.stringify({"action": "seek", currentTime: video.currentTime}));
}

video.onpause = () => {
    if(doingSyncedAction) return;
    client.send(JSON.stringify({"action": "pause"}));
}




