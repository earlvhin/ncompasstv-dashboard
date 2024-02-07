import { TABLE_ROW_FORMAT } from '.';
import { UI_CONTENT } from './ui_content.model';

export class UI_SINGLE_SCREEN {
    screen_id: string;
    screen_title: string;
    description: string;
    type?: string;
    assigned_dealer_id: string;
    assigned_dealer: string;
    assigned_host_id: string;
    assigned_host: string;
    assigned_template_id: string;
    assigned_template: string;
    created_by: string;
    notes?: string;
    screen_zone_playlist: UI_SCREEN_ZONE_PLAYLIST[];
    screen_license: SCREEN_LICENSE_TABLE_FORMAT[];

    constructor(
        id: string,
        title: string,
        description: string,
        dealer_id: string,
        dealer_name: string,
        host_id: string,
        host_name: string,
        template_id: string,
        template_name: string,
        created_by: string,
        screen_zone_playlist: UI_SCREEN_ZONE_PLAYLIST[],
        licenses: SCREEN_LICENSE_TABLE_FORMAT[],
    ) {
        this.screen_id = id;
        this.screen_title = title;
        this.description = description;
        this.assigned_dealer_id = dealer_id;
        this.assigned_dealer = dealer_name;
        this.assigned_host_id = host_id;
        this.assigned_host = host_name;
        this.assigned_template_id = template_id;
        this.assigned_template = template_name;
        this.created_by = created_by;
        this.screen_zone_playlist = screen_zone_playlist;
        this.screen_license = licenses;
    }
}

export class UI_SCREEN_ZONE_PLAYLIST {
    screen_template: UI_ZONE_PLAYLIST;
    contents: UI_CONTENT[];

    constructor(screen_template: UI_ZONE_PLAYLIST, contents: UI_CONTENT[]) {
        this.screen_template = screen_template;
        this.contents = contents;
    }
}

export class UI_ZONE_PLAYLIST {
    screen_id: string;
    template_id: string;
    zone_id: string;
    x_pos: string;
    y_pos: string;
    height: string;
    width: string;
    playlist_id: string;
    name: string;
    playlist_name: string;
    description: string;
    order: number;
    link?: string;

    constructor(
        screen_id: string,
        template_id: string,
        zone_id: string,
        x_pos: string,
        y_pos: string,
        height: string,
        width: string,
        playlist_id: string,
        playlist_name: string,
        name: string,
        description: string,
        order: number,
    ) {
        this.screen_id = screen_id;
        this.template_id = template_id;
        this.zone_id = zone_id;
        this.x_pos = x_pos;
        this.y_pos = y_pos;
        this.height = height;
        this.width = width;
        this.playlist_id = playlist_id;
        this.playlist_name = playlist_name;
        this.name = name;
        this.description = description;
        this.order = order;
    }
}

export class UI_SCREEN_LICENSE {
    license_id: string;
    index: number;
    license_key: string;
    alias: string;
    internet_type: string;
    internet_speed: string;
    is_activated: number;
    is_registered: number;

    constructor(
        id: string,
        i: number,
        key: string,
        alias: string,
        type: string,
        speed: string,
        is_activated: number,
        is_registered: number,
    ) {
        this.license_id = id;
        this.index = i;
        this.license_key = key;
        this.alias = alias;
        this.internet_type = type;
        this.internet_speed = speed;
        this.is_activated = is_activated;
        this.is_registered = is_registered;
    }
}

export class UI_SCREEN_LICENSE_SCREENS {
    license_id: object;
    index: object;
    license_key: object;
    alias: object;
    internet_type: object;
    internet_speed: object;
    is_activated: object;
    is_registered: object;
    pi_status: object;
    player_status: object;

    constructor(
        id: object,
        i: object,
        key: object,
        alias: object,
        type: object,
        speed: object,
        is_activated: object,
        is_registered: object,
        pi_status: object,
        player_status: object,
    ) {
        this.license_id = id;
        this.index = i;
        this.license_key = key;
        this.alias = alias;
        this.internet_type = type;
        this.internet_speed = speed;
        this.is_activated = is_activated;
        this.is_registered = is_registered;
        this.pi_status = pi_status;
        this.player_status = player_status;
    }
}

interface SCREEN_LICENSE_TABLE_FORMAT {
    license_id: TABLE_ROW_FORMAT;
    index: TABLE_ROW_FORMAT;
    license_key: TABLE_ROW_FORMAT;
    alias: TABLE_ROW_FORMAT;
    internet_type: TABLE_ROW_FORMAT;
    internet_speed: TABLE_ROW_FORMAT;
    is_activated: TABLE_ROW_FORMAT;
    is_registered: TABLE_ROW_FORMAT;
}
