export interface CREATE_PLAYLIST {
    assets: CREATE_PLAYLIST_CONTENT[];
    dealerId: string;
    playlistDescription: string;
    playlistName: string;
}

export interface CREATE_PLAYLIST_CONTENT {
    contentId: string;
    duration: number;
    handlerId: string;
    isFullScreen: number;
    seq: number;
}
