export class API_CREATE_PLAYLIST {
    dealerId: string;
    playlistName: string;
    playlistType: string;
    playlistDescription: string;
    assets: API_CREATE_PLAYLIST_CONTENT[];
    constructor(
        dealer: string,
        name: string,
        type: string,
        description: string,
        assets: API_CREATE_PLAYLIST_CONTENT[],
    ) {
        this.dealerId = dealer;
        this.playlistName = name;
        this.playlistType = type;
        this.playlistDescription = description;
        this.assets = assets;
    }
}

export class API_CREATE_PLAYLIST_CONTENT {
    contentId: string;
    handlerId: string;
    seq: number;
    isFullScreen: number;
    duration: number;

    constructor(
        contentId: string,
        handler: string,
        seq: number,
        fullscreen: number,
        duration: number,
    ) {
        this.contentId = contentId;
        this.handlerId = handler;
        this.seq = seq;
        this.isFullScreen = fullscreen;
        this.duration = duration;
    }
}
