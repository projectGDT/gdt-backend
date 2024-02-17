// declare some json structures that used in the communication with plugin

export type PlayerProfile = {
    uniqueIdProvider: number,
    uniqueId: string,
    cachedPlayerName: string
}

export type PlayerLoginEventData = {
    profile: PlayerProfile,
    timeStamp: number
}

export type PlayerLogoutEventData = {
    profile: PlayerProfile,
    timeStamp: number
}

export type KickResponseData = {
    success: boolean,
    timeStamp: number
}