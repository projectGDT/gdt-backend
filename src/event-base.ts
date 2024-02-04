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

    // on
    listen<T extends GDTEvent>(event: T, listener: (event: T) => void) {
        return super.on(event.typeId, listener)
    }

    // emit
    fire<T extends GDTEvent>(event: T) {
        return super.emit(event.typeId, event)
    }
}