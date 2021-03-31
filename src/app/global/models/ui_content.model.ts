import { API_CONTENT } from './api_content.model';
import { API_HOST } from './api_host.model';
import { API_LICENSE, API_LICENSE_PROPS } from './api_license.model';
import { BLACKLISTED_CONTENT } from './api_single-playlist.model';
import { UI_PLAYLIST_HOST_LICENSE } from './ui_playlist-host-license.model';

export class UI_CONTENT {
	advertiser_id: string;
    playlist_content_id: string;
    created_by: string;
    created_by_name: string;
    content_id: string;
	dealer_id: string;
	duration: number;
    host_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    handler_id: string;
    date_uploaded: string;
    is_fullscreen: number;
    file_size: number;
	thumbnail: string;
	is_active: number;
	is_converted: number;
    uuid: string;
    title: string;
    uploaded_by: string;

    constructor(
        playlist_content_id: string, 
        created_by: string, 
        content_id: string, created_by_name: string, dealer_id: string, duration: number, 
		host_id: string, advertiser_id: string, filename: string, file_url: string, 
		file_type: string, handler_id: string, date_uploaded: string, is_fullscreen: number,
        file_size: number, thumbnail: string, is_active: number, is_converted: number, uuid: string, 
        title?: string, uploaded_by?: string
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
		}
	]
}