// listen events from server and emit them on node.js

import { PrismaClient } from "@prisma/client";
import {Server} from "socket.io";
import { matches } from "../utils/digest";
import {emitter} from "../event/event-base";
import {
    PlayerLoginEvent,
    PlayerLogoutEvent,
    KickPlayerEvent,
    KickResponseEvent,
} from "../event/plugin-event";

module.exports = (io: Server, prisma: PrismaClient) => io.of("/plugin").on("connection", async socket => {
    // verify server id and token
    const auth = socket.handshake.auth;
    const server = await prisma.server.findUnique({
        where: {
            id: auth.id,
        }
    });
    // not exist
    if (!server) {
        socket.emit("id-invalid")
        return
    }
    // wrong token
    if (!matches(auth.token, server.tokenDigested)) {
        socket.emit("token-invalid")
        return
    }

    // listening basic events from MC server plugins
    socket.on(PlayerLoginEvent.typeId, json => emitter.emit(PlayerLoginEvent.typeId, new PlayerLoginEvent(server, json)));
    socket.on(PlayerLogoutEvent.typeId, json => emitter.emit(PlayerLogoutEvent.typeId, new PlayerLogoutEvent(server, json)));

    // listening server response after emitting kick-online-player
    socket.on(KickResponseEvent.typeId, json => emitter.emit(KickResponseEvent.typeId, new KickResponseEvent(server, json)));

    // after receiving kick-online-player request from frontend
    emitter.on(KickPlayerEvent.typeId, (event: KickPlayerEvent) => {
        // don't emit on wrong server
        if (event.serverId !== server.id) {
            return;
        }
        socket.emit("kick-online-player", {
            profile: event.playerProfile,
            timestamp: event.timestamp,
        });
    });
});