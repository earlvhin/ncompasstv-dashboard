import { API_CONTENT } from './api_content.model';
import { API_HOST } from './api_host.model';
import { API_LICENSE, API_LICENSE_PROPS } from './api_license.model';
import { BLACKLISTED_CONTENT } from './api_single-playlist.model';
import { PlaylistContentSchedule } from './playlist-content-schedule.model';
import { UI_PLAYLIST_HOST_LICENSE } from './ui_playlist-host-license.model';

export class UI_CONTENT {
    advertiser_id?: string;
    classification?: string;
    content_id: string;
    content_data?: any;
    created_by: string;
    created_by_name: string;
    date_uploaded: string;
    dealer_id: string;
    duration: number;
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
    handler_id: string;
    host_id: string;
    index: number;
    is_active: number;
    is_converted: number;
    is_fullscreen: number;
    is_protected: number;
    owner_name: string;
    owner_role_id?: string;
    owner_type?: string;
    playlist_content_id?: string;
    playlist_content_schedule?: PlaylistContentSchedule;
    schedule_status?: string;
    seq?: number;
    thumbnail: string;
    time_uploaded: string;
    title: string;
    uploaded_by: string;
    uuid: string;

    constructor(
        playlist_content_id: string,
        created_by: string,
        content_id: string,
        created_by_name: string,
        dealer_id: string,
        duration: number,
        host_id: string,
        advertiser_id: string,
        filename: string,
        file_url: string,
        file_type: string,
        handler_id: string,
        date_uploaded: string,
        is_fullscreen: number,
        file_size: number,
        thumbnail: string,
        is_active: number,
        is_converted: number,
        is_protected: number,
        uuid: string,
        title?: string,
        playlist_content_schedule?: any,
        uploaded_by?: string,
        owner_role_id?: string,
        classification?: string,
        seq?: number,
    ) {
        this.playlist_content_id = playlist_content_id;
        this.created_by = created_by;
        this.content_id = content_id;
        this.created_by_name = created_by_name;
        this.dealer_id = dealer_id;
        this.duration = duration;
        this.host_id = host_id;
        this.advertiser_id = advertiser_id;
        this.file_name = filename;
        this.file_url = file_url;
        this.file_type = file_type;
        this.handler_id = handler_id;
        this.date_uploaded = date_uploaded;
        this.is_fullscreen = is_fullscreen;
        this.file_size = file_size;
        this.thumbnail = thumbnail;
        this.is_active = is_active;
        this.is_converted = is_converted;
        this.uuid = uuid;
        this.title = title;
        this.uploaded_by = uploaded_by;
        this.owner_role_id = owner_role_id;
        this.classification = classification;
        this.playlist_content_schedule = playlist_content_schedule;
        this.seq = seq;
        this.is_protected = is_protected;
    }
}

export class UI_PLAYLIST_CONTENT {
    content_data: UI_CONTENT;
    host_license_data: UI_PLAYLIST_HOST_LICENSE[];
    constructor(content: UI_CONTENT, host: UI_PLAYLIST_HOST_LICENSE[]) {
        this.content_data = content;
        this.host_license_data = host;
    }
}

export class UI_CONTENT_PER_ZONE {
    zone_name: string;
    zone_order: number;
    contents: UI_CONTENT[];
    playlist_name: string;
    playlist_id: string;

    constructor(name: string, order: number, contents: UI_CONTENT[], playlist_name: string, playlist_id: string) {
        this.zone_name = name;
        this.zone_order = order;
        this.contents = contents;
        this.playlist_name = playlist_name;
        this.playlist_id = playlist_id;
    }
}

export class UI_PLAYLIST_BLOCKLIST_HOST_LICENSE {
    content: API_CONTENT;
    blocklist: BLACKLISTED_CONTENT[];
    host_license: [
        {
            host: API_HOST;
            licenses: API_LICENSE_PROPS[];
        },
    ];
}

export class UI_PLAYING_WHERE_CONTENT {
    license_id: object;
    index: object;
    license_alias: object;
    host: object;
    screen_name: object;
    constructor(license_id: object, index: object, license_alias: object, host: object, screen_name: object) {
        this.license_id = license_id;
        this.index = index;
        this.license_alias = license_alias;
        this.host = host;
        this.screen_name = screen_name;
    }
}

export class UI_CONTENT_HISTORY {
    index: object;
    playlistContentId: object;
    playlistId: object;
    playlistName: object;
    logAction: object;
    logUser: object;
    logDate: object;
    constructor(
        index: object,
        playlistContentId: object,
        playlistId: object,
        playlistName: object,
        logAction: object,
        logUser: object,
        logDate: object,
    ) {
        this.index = index;
        this.playlistContentId = playlistContentId;
        this.playlistId = playlistId;
        this.playlistName = playlistName;
        this.logAction = logAction;
        this.logUser = logUser;
        this.logDate = logDate;
    }
}
