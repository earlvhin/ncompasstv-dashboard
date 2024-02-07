import { UI_PLAYLIST_LICENSE } from './ui_playlist-host-license.model';

export class UI_PLAYLIST_HOST_LICENSE_CHECKBOX {
    content_id: string;
    host_id: string;
    licenses: UI_PLAYLIST_LICENSE[];

    constructor(content: string, host: string, licenses: UI_PLAYLIST_LICENSE[]) {
        this.content_id = content;
        this.host_id = host;
        this.licenses = licenses;
    }
}
