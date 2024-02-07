export class API_NEW_SCREEN {
    screen: SCREEN_INFO;
    screenZonePlaylists: SCREEN_ZONE_PLAYLIST[];
    licenses: SCREEN_LICENSE[];
    constructor(
        screen: SCREEN_INFO,
        zone_playlist: SCREEN_ZONE_PLAYLIST[],
        license: SCREEN_LICENSE[],
    ) {
        this.screen = screen;
        this.screenZonePlaylists = zone_playlist;
        this.licenses = license;
    }
}

export class SCREEN_INFO {
    screenName: string;
    description: string;
    dealerid: string;
    hostid: string;
    templateid: string;
    createdby: string;
    screenTypeId: string;

    constructor(
        title: string,
        description: string,
        dealerid: string,
        hostid: string,
        templateid: string,
        createdby: string,
        screenTypeId: string,
    ) {
        this.screenName = title;
        this.description = description;
        this.dealerid = dealerid;
        this.hostid = hostid;
        this.templateid = templateid;
        this.createdby = createdby;
        this.screenTypeId = screenTypeId;
    }
}

export class SCREEN_ZONE_PLAYLIST {
    templateId: string;
    templateZoneId: string;
    playlistId: string;

    constructor(template_id: string, templateZoneId: string, playlistId: string) {
        this.templateId = template_id;
        this.templateZoneId = templateZoneId;
        this.playlistId = playlistId;
    }
}

export class SCREEN_LICENSE {
    licenseId: string;
    constructor(id: string) {
        this.licenseId = id;
    }
}
