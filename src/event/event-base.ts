import {EventEmitter} from "node:events";

export abstract class GDTEvent {
    static typeId: string
    timestamp: number = 0
}

export class GDTEventEmitter extends EventEmitter {
    constructor() {
        super()
    }

    override on<T extends GDTEvent>(typeId: string, listener: (event: T) => void) {
        return super.on(typeId, listener)
    }

    override emit(typeId: string, event: GDTEvent) {
        // set timestamp when initializing a new event.
        // event.timestamp = Date.now()
        return super.emit(typeId, event)
    }
}

export const preRegistries = new EventEmitter()
export const emitter = new GDTEventEmitter()