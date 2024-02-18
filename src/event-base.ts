import {EventEmitter} from "node:events";

export abstract class GDTEvent {
    static typeId: string
    timestamp: number = 0
}

export class GDTEventEmitter extends EventEmitter {
    constructor() {
        super()
    }

    // an alternative of on(eventName, listener)
    // usage: listen<EventType>(EventType, event => ...)
    // the compiler will infer the type of "event" param
    // There's no way to determine whether T and "type" is the same.
    // So it all depends on the caller.
    listen<T extends GDTEvent>(type: typeof GDTEvent, listener: (event: T) => void) {
        return super.on(type.typeId, listener)
    }

    // an alternative of emit(eventName, ...args)
    // usage: fire(EventType, event)
    // the compiler will infer the type of "event" param.
    fire(type: typeof GDTEvent, event: GDTEvent) {
        event.timestamp = Date.now()
        return super.emit(type.typeId, event)
    }
}

export const preRegistries = new EventEmitter()
export const emitter = new GDTEventEmitter()