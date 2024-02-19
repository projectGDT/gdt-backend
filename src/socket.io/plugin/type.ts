// declare some json structures that used in the communication with plugin

export type PlayerProfile = {
    uniqueIdProvider: number,
    uniqueId: string,
    cachedPlayerName: string
}

export type PlayerLoginEventData = {
    profile: PlayerProfile,
    timestamp: number
}

export type PlayerLogoutEventData = {
    profile: PlayerProfile,
    timestamp: number
}

export type KickResponseData = {
    success: boolean,
    timestamp: number
}