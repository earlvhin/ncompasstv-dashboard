export class API_PLAYLIST {
    playlists: Array<any>;
    playlist: Array<any>;
    playlistId: string;
    dealerId: string;
    playlistName?: string;
    name?: string;
    playlistDescription: string;
    playlistType: string;
    dateCreated: string;
    dateUpdated: string;
    businessName: string;
}

export interface API_PLAYLIST_MINIFIED {
    businessName: string;
    dealerId: string;
    playlistId: string;
    playlistName: string;
}
