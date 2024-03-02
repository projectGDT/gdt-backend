// listen events from server and emit them on node.js

import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { matches } from "../utils/digest";
import { emitter } from "../event/event-base";
import {
    PlayerLoginEvent,
    PlayerLogoutEvent,
    KickPlayerEvent,
    KickResponseEvent,
} from "../event/plugin-event";

module.exports = (io: Server, prisma: PrismaClient) => io.of("/plugin").use(async (socket, next) => {
    // verify server id and token
    const auth = socket.handshake.auth;
    const server = await prisma.server.findUnique({
        where: {
            id: auth.id,
        }
    });
    // not exist
    if (!server) {
        next(new Error("id-invalid"));
        return;
    }
    // wrong token
    if (!matches(auth.token, server.tokenDigested)) {
        next(new Error("token-invalid"));
        return;
    }
    
    // listening basic events from MC server plugins
    socket.on("player-login", json => emitter.fire(PlayerLoginEvent, new PlayerLoginEvent(server, json)));
    socket.on("player-logout", json => emitter.fire(PlayerLogoutEvent, new PlayerLogoutEvent(server, json)));

    // listening server response after emitting kick-online-player
    socket.on("kick-online-player-response", json => emitter.fire(KickResponseEvent, new KickResponseEvent(server, json)));

    // after receiving kick-online-player request from frontend
    emitter.listen(KickPlayerEvent, (event: KickPlayerEvent) => {
        // don't emit on wrong server
        if (event.serverId !== server.id) {
            return;
        }
        socket.emit("kick-online-player", {
            profile: event.playerProfile,
            timestamp: event.timestamp,
        });
    });
    next();
});