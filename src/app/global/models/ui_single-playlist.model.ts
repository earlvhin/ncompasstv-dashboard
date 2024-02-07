import { UI_CONTENT, UI_PLAYLIST_CONTENT } from './ui_content.model';
import { UI_HOST_LICENSE } from './ui_host-license.model';
import { UI_PLAYLIST_HOST_LICENSE } from './ui_playlist-host-license.model';

export class UI_SINGLE_PLAYLIST {
    id: string;
    dealer: string;
    name: string;
    description: string;
    created_by: string;
    date_created: string;
    type: string;
    contents: UI_PLAYLIST_CONTENT[];
    screens: UI_PLAYLIST_SCREENS[];
    host_licenses: UI_PLAYLIST_HOST_LICENSE[];

    constructor(
        id: string,
        dealer: string,
        playlist_name: string,
        playlist_description: string,
        created_by: string,
        date_created: string,
        playlist_type: string,
        playlist_content: UI_PLAYLIST_CONTENT[],
        host_licenses: UI_PLAYLIST_HOST_LICENSE[],
    ) {
        this.id = id;
        this.dealer = dealer;
        this.name = playlist_name;
        this.description = playlist_description;
        this.created_by = created_by;
        this.date_created = date_created;
        this.type = playlist_type;
        this.contents = playlist_content;
        this.host_licenses = host_licenses;
    }
}

export class UI_PLAYLIST_SCREENS {
    screen_id: string;
    index: number;
    title: string;

    constructor(id: string, index: number, title: string) {
        this.screen_id = id;
        this.index = index;
        this.title = title;
    }
}

export class UI_PLAYLIST_SCREENS_NEW {
    screen_id: object;
    index: object;
    title: object;
    dealer: any;
    host: any;
    type: any;
    template: any;
    createdby: any;

    constructor(
        id: object,
        index: object,
        title: object,
        dealer: any,
        host: any,
        type: any,
        template: any,
        created: any,
    ) {
        this.screen_id = id;
        this.index = index;
        this.title = title;
        this.dealer = dealer;
        this.host = host;
        this.type = type;
        this.template = template;
        this.createdby = created;
    }
}

export class UI_BLOCKLIST_CONTENT {
    block_id: string;
    license_id: string;
    content_id: string;
    date_created: string;
    date_updated: string;

    constructor(
        block_id: string,
        license_id: string,
        content_id: string,
        date_created: string,
        date_updated: string,
    ) {
        this.block_id = block_id;
        this.license_id = license_id;
        this.content_id = content_id;
        this.date_created = date_created;
        this.date_updated = date_updated;
    }
}

export class REMOVE_BLOCKLISTED_LICENSE {
    BlacklistedContentId: string;
    constructor(id: string) {
        this.BlacklistedContentId = id;
    }
}
