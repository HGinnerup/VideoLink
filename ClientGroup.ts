import EventEmitter from "events";
import { SyncClient, EventTypes, SyncClientEvent } from "./SyncClient";

export class ClientGroup {
    clients:{ [id: number] : SyncClient; } = {};
    
    constructor() {

    }

    private eventEmitter = new EventEmitter();
    addEventListener(type: EventTypes, listener: ((data:SyncClientEvent) => void)):void {
        this.eventEmitter.addListener(type, listener)
        for(let clientId in this.clients) {
            this.clients[clientId].addEventListener(type, listener)
        }
    }

    removeEventListener(type: EventTypes, listener: ((data:SyncClientEvent) => void)):void {
        this.eventEmitter.removeListener(type, listener)
        for(let clientId in this.clients) {
            this.clients[clientId].removeEventListener(type, listener)
        }
    }

    public addClient(client: SyncClient) {
        this.clients[client.uniqueId] = client;

        client.addEventListener("socketClosed", () => this.removeClient(client));
        
        for(let event of this.eventEmitter.eventNames()) {
            for(let listener of this.eventEmitter.listeners(event)) {
                // @ts-ignore
                client.addEventListener(event, listener)
            }
        }
    }

    public removeClient(client: SyncClient) {
        delete this.clients[client.uniqueId];
        
        for(let event of this.eventEmitter.eventNames()) {
            for(let listener of this.eventEmitter.listeners(event)) {
                // @ts-ignore
                client.removeEventListener(event, listener)
            }
        }
    }

    async broadcast(data:SyncClientEvent) {
        await Promise.all(Object.values(this.clients).map(async client => {
            client.send(data);
        }));
    }

}

