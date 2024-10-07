export class API_PLAYLIST {
    businessName: string;
    dateCreated: string;
    dateUpdated: string;
    dealerId: string;
    isMigrated: number;
    name: any;
    playlistDescription: string;
    playlistId: string;
    playlistName: any;
    playlistType: string;
    playlists: Array<any>;
    totalContents: number;
    totalScreens: number;
}

export class API_PLAYLIST_PAGINATED {
    content: any;
    playlist: API_PLAYLIST[];
}

export interface API_PLAYLIST_MINIFIED {
    businessName: string;
    dealerId: string;
    playlistId: string;
    playlistName: string;
}
