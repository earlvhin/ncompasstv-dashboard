import { API_CONTENT_V2 } from './api_content_v2.model';

export interface API_PLAYLIST_V2 {
    playlist: {
        assets?: any;
        businessName?: string;
        dateCreated: string;
        dateUpdated?: string;
        dealerId: string;
        hosts?: any;
        playlistDescription: string;
        playlistId: string;
        playlistName: string;
        totalContents: number;
        isMigrated: number;
    };
    playlistContents: API_CONTENT_V2[];
}
