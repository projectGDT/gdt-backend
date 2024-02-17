// listen events from server and emit them on node.js

import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { matches } from "../../utils/digest";
import {
    PlayerLoginEvent, PlayerLoginEventEmitter,
    PlayerLogoutEvent, PlayerLogoutEventEmitter,
    KickResponseEvent, KickResponseEventEmitter
} from "./plugin-event";

module.exports = (io: Server, prisma: PrismaClient) => io.of("/plugin/server").use(async (socket, next) => {
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
    socket.on("player-login", json => {
        const event = new PlayerLoginEvent();
        event.setData(server, json);
        new PlayerLoginEventEmitter().fire(event);
    });

    socket.on("player-logout", json => {
        const event = new PlayerLogoutEvent();
        event.setData(server, json);
        new PlayerLogoutEventEmitter().fire(event);
    });

    // listening server response after emitting kick-online-player
    socket.on("kick-online-player-response", json => {
        const event = new KickResponseEvent();
        event.setData(server, json);
        new KickResponseEventEmitter().fire(event);
    });
});