// some basic events that plugin must emit

import {Server, Profile} from "@prisma/client";
import {GDTEvent} from "./event-base";

export type PlayerLoginEventData = {
    profile: Profile,
    timestamp: number
}
export type PlayerLogoutEventData = {
    profile: Profile,
    timestamp: number
}
export type KickResponseData = {
    success: boolean,
    timestamp: number
}

export class PlayerLoginEvent extends GDTEvent {
    static typeId = "player-login";
    server: Server;
    playerProfile: Profile;

    constructor(server: Server, json: PlayerLoginEventData) {
        super();
        this.server = server;
        this.playerProfile = json.profile;
        this.timestamp = json.timestamp;
    }
}

export class PlayerLogoutEvent extends GDTEvent {
    static typeId = "player-logout";
    server: Server;
    playerProfile: Profile;

    constructor(server: Server, json: PlayerLogoutEventData) {
        super();
        this.server = server;
        this.playerProfile = json.profile;
        this.timestamp = json.timestamp;
    }
}

export class KickPlayerEvent extends GDTEvent {
    static typeId = "kick-online-player";
    serverId: number;
    playerProfile: Profile;

    constructor(serverId: number, playerProfile: Profile) {
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

    constructor(server: Server, json: KickResponseData) {
        super();
        this.server = server;
        this.success = json.success;
        this.timestamp = json.timestamp;
    }
}