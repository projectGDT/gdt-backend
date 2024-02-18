import {EventEmitter} from "node:events";

export abstract class GDTEvent {
    readonly typeId: string

    protected constructor(typeId: string) {
        this.typeId = typeId
    }
}

export class GDTEventEmitter extends EventEmitter {
    constructor() {
        super()
    }

    // an alternative of on(eventName, listener)
    // usage: listen<EventType>(event => ...)
    // the compiler will infer the type of "event" param
    listen<T extends GDTEvent>(event: T, listener: (event: T) => void) {
        return super.on(event.typeId, listener)
    }

    // an alternative of emit(eventName, ...args)
    // usage: fire(event)
    // the compiler will infer the type of "event" param
    fire<T extends GDTEvent>(event: T) {
        return super.emit(event.typeId, event)
    }
}

export const preRegistries = new EventEmitter()
export const emitter = new GDTEventEmitter()