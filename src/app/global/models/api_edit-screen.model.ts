export class API_EDIT_SCREEN {
    screen: EDIT_SCREEN_INFO;
    screenZonePlaylists: EDIT_SCREEN_ZONE_PLAYLIST[];

    constructor(screen: EDIT_SCREEN_INFO, screen_zone: EDIT_SCREEN_ZONE_PLAYLIST[]) {
        this.screen = screen;
        this.screenZonePlaylists = screen_zone;
    }
}

export class EDIT_SCREEN_INFO {
    screenId: string;
    screenName: string;
    description: string;
    screenTypeId: string;
    hostId: string;
    templateId: string;

    constructor(
        id: string,
        name: string,
        desc: string,
        screenTypeId: string,
        host: string,
        template: string,
    ) {
        this.screenId = id;
        this.screenName = name;
        this.description = desc;
        this.screenTypeId = screenTypeId;
        this.hostId = host;
        this.templateId = template;
    }
}

export class EDIT_SCREEN_ZONE_PLAYLIST {
    templateZoneId: string;
    playlistId: string;

    constructor(zone_id: string, playlist_id: string) {
        this.templateZoneId = zone_id;
        this.playlistId = playlist_id;
    }
}
