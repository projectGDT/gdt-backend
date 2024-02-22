// some basic events that plugin must emit

import { Server } from "@prisma/client";
import { GDTEvent, GDTEventEmitter } from "../../event-base";
import * as type from "./type"

export class PlayerLoginEvent extends GDTEvent {
    static typeId = "player-login";
    server: Server;
    playerProfile: type.PlayerProfile;

    constructor(server: Server, json: type.PlayerLoginEventData) {
        super();
        this.server = server;
        this.playerProfile = json.profile;
        this.timestamp = json.timestamp;
    }
}

export class PlayerLogoutEvent extends GDTEvent {
    static typeId = "player-logout";
    server: Server;
    playerProfile: type.PlayerProfile;

    constructor(server: Server, json: type.PlayerLogoutEventData) {
        super();
        this.server = server;
        this.playerProfile = json.profile;
        this.timestamp = json.timestamp;
    }
}

export class KickPlayerEvent extends GDTEvent {
    static typeId = "kick-online-player";
    serverId: number;
    playerProfile: type.PlayerProfile;

    constructor(serverId: number, playerProfile: type.PlayerProfile) {
        super();
        this.serverId = serverId;
        this.playerProfile = playerProfile;
        this.timestamp = Date.now();
    }
}

export class KickResponseEvent extends GDTEvent {
    static typeId = "kick-online-player-response";
    server: Server;
    success: boolean;

    constructor(server: Server, json: type.KickResponseData) {
        super();
        this.server = server;
        this.success = json.success;
        this.timestamp = json.timestamp;
    }
}