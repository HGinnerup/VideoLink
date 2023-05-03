import { ClientGroup } from "./ClientGroup";

export class SyncManager {
    clients: ClientGroup = new ClientGroup();

    constructor() {
        this.clients.addEventListener("play", (evt => {
            this.clients.broadcast(evt)
        }))

        this.clients.addEventListener("seek", (evt => {
            this.clients.broadcast(evt)
        }))

        this.clients.addEventListener("pause", (evt => {
            this.clients.broadcast(evt)
        }))

        this.clients.addEventListener("getTime", (evt => {
            this.clients.broadcast(evt)
        }))

        this.clients.addEventListener("ping", (evt => {
            this.clients.broadcast(evt)
        }))
    }


    setVideo() {

    }

    setSubtitles() {

    }

    setTime(time: number) {

    }

    setPlaying(playing: boolean) {

    }


}