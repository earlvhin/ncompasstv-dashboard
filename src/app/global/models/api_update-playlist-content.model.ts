export class API_UPDATE_PLAYLIST_CONTENT {
    playlist: any;
    playlistContents: API_UPDATED_PLAYLIST_CONTENT[];

    constructor(playlist_id: string, contents: API_UPDATED_PLAYLIST_CONTENT[]) {
        this.playlist = { playlistId: playlist_id };
        this.playlistContents = contents;
    }
}

export class API_UPDATED_PLAYLIST_CONTENT {
    contentId: string;
    isFullScreen: number;
    seq: number;
    duration: number;
    playlistContentId: string;
    constructor(content_id: string, is_fullscreen: number, seq: number, duration: number, playlistContentId: string) {
        this.contentId = content_id;
        this.isFullScreen = is_fullscreen;
        this.seq = seq;
        this.duration = duration;
        this.playlistContentId = playlistContentId;
    }
}
