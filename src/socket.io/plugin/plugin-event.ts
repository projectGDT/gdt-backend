// some basic events that plugin must emit

import { Server } from "@prisma/client";
import { GDTEvent, GDTEventEmitter } from "../../event-base";
import * as type from "./type"

export class PlayerLoginEvent extends GDTEvent {
    server: Server | undefined;
    playerProfile: type.PlayerProfile | undefined;
    timeStamp: number | undefined;

    constructor() {
        super("player-login");
    }

    setData(server: Server, json: type.PlayerLoginEventData) {
        this.server = server;
        this.playerProfile = json.profile;
        this.timeStamp = json.timeStamp;
    }
}

export class PlayerLoginEventEmitter extends GDTEventEmitter {
    onPlayerLoginEvent(listener: (event: PlayerLoginEvent) => void) {
        this.listen(new PlayerLoginEvent(), listener);
    }
}

export class PlayerLogoutEvent extends GDTEvent {
    server: Server | undefined;
    playerProfile: type.PlayerProfile | undefined;
    timeStamp: number | undefined;

    constructor() {
        super("player-logout");
    }

    setData(server: Server, json: type.PlayerLogoutEventData) {
        this.server = server;
        this.playerProfile = json.profile;
        this.timeStamp = json.timeStamp;
    }
}

export class PlayerLogoutEventEmitter extends GDTEventEmitter {
    onPlayerLogoutEvent(listener: (event: PlayerLogoutEvent) => void) {
        this.listen(new PlayerLogoutEvent(), listener);
    }
}

export class KickResponseEvent extends GDTEvent {
    server: Server | undefined;
    success: boolean | undefined;
    timeStamp: number | undefined;

    constructor() {
        super("kick-online-player-response");
    }

    setData(server: Server, json: type.KickResponseData) {
        this.server = server;
        this.success = json.success;
        this.timeStamp = json.timeStamp;
    }
}

export class KickResponseEventEmitter extends GDTEventEmitter {
    onKickResponseEvent(listener: (event: KickResponseEvent) => void) {
        this.listen(new KickResponseEvent(), listener);
    }
}