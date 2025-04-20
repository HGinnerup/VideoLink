import EventEmitter from "events";
import ws from "ws";


export type EventTypes = "socketClosed" | "play" | "seek" | "pause" | "ping" | "getTime" | "newVideo" | "newCaptions"
export type SyncClientEvent = {
    senderId: number,
    action: EventTypes,
    data: any
}

export class SyncClient {
    public static readonly ALL_CLIENTS: SyncClient[] = [];
    private static nextId: number = 1;

    readonly uniqueId: number = SyncClient.nextId++;

    private socket: ws.WebSocket;

    private eventEmitter = new EventEmitter();

    constructor(socket: ws.WebSocket) {
        this.socket = socket;
        SyncClient.ALL_CLIENTS.push(this);

        socket.on("close", () => this.eventEmitter.emit("socketClosed"))
        socket.on("message", (buffer:Buffer) => {
            try {
                let data:SyncClientEvent = JSON.parse(String(buffer))
                if(data.action === "socketClosed")
                    throw new Error(`Client ${this.uniqueId} sent event of type "socketClosed"`)

                data.senderId = this.uniqueId;
                this.eventEmitter.emit(data.action, data)
            }
            catch(err) {
                console.error(err)
            }
        });
    }

    addEventListener(type: EventTypes, listener: ((data:SyncClientEvent) => void)):void {
        this.eventEmitter.addListener(type, listener)
    }

    removeEventListener(type: EventTypes, listener: ((data:SyncClientEvent) => void)):void {
        this.eventEmitter.removeListener(type, listener)
    }

    async send(data:SyncClientEvent) {
        await this.socket.send(JSON.stringify(data));
    }

}

