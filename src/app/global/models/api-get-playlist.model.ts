import { API_CONTENT } from './api_content.model';
import { API_PLAYLIST } from './api_playlists.model';

export interface API_GET_PLAYLIST {
    contents: API_CONTENT[];
    playlist: API_PLAYLIST;
}
