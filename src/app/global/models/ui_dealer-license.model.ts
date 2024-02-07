export class UI_DEALER_LICENSE {
    index: object;
    license_id: object;
    screenshot: object;
    license_key: object;
    // type: object;
    host_name: object;
    alias: object;
    last_push: object;
    last_online: object;
    // connection_type: object;
    // connection_speed: object;
    display: object;
    anydesk: object;
    anydesk_password: object;
    // server_version: object;
    // ui_version: object;
    screen: object;
    // template: object;
    date_installed: object;
    // date_created: object;
    is_activated: object;
    is_assigned: object;
    pi_status: object;
    // player_status: object;

    constructor(
        index: object,
        id: object,
        screenshot: object,
        key: object,
        // type: object,
        host: object,
        alias: object,
        last_push: object,
        last_online: object,
        // connection_type: object,
        // connection_speed: object,
        display: object,
        anydesk: object,
        // anydesk_password: object,
        // server: object,
        // ui: object,
        screen: object,
        // template: object,
        date_installed: object,
        // date_created: object,
        is_activated: object,
        is_assigned: object,
        pi_status: object,
        // player_status: object,
    ) {
        this.index = index;
        this.license_id = id;
        this.screenshot = screenshot;
        this.license_key = key;
        // this.type = type;
        this.host_name = host;
        this.alias = alias;
        this.last_push = last_push;
        this.last_online = last_online;
        // this.connection_type = connection_type;
        // this.connection_speed = connection_speed;
        this.display = display;
        this.anydesk = anydesk;
        // this.anydesk_password = anydesk_password;
        // this.server_version = server;
        // this.ui_version = ui;
        this.screen = screen;
        // this.template = template;
        this.date_installed = date_installed;
        // this.date_created = date_created;
        this.is_activated = is_activated;
        this.is_assigned = is_assigned;
        this.pi_status = pi_status;
        // this.player_status = player_status;
    }
}

export class UI_LICENSE {
    index: object;
    license_id: object;
    screenshot: object;
    license_key: object;
    dealer: object;
    host_name: object;
    alias: object;
    last_push: object;
    last_online: object;
    display: object;
    anydesk: object;
    // password: object;
    date_installed: object;
    pi_status: object;
    player_status: object;
    is_activated?: object;

    constructor(
        index: object,
        id: object,
        screenshot: object,
        key: object,
        dealer: object,
        host: object,
        alias: object,
        last_push: object,
        last_online: object,
        display: object,
        anydesk: object,
        // password: object,
        date_installed: object,
        pi_status: object,
        player_status: object,
        is_activated?: object,
    ) {
        this.index = index;
        this.license_id = id;
        this.screenshot = screenshot;
        this.license_key = key;
        this.dealer = dealer;
        this.host_name = host;
        this.alias = alias;
        this.last_push = last_push;
        this.last_online = last_online;
        this.display = display;
        this.anydesk = anydesk;
        // this.password = password;
        this.date_installed = date_installed;
        this.pi_status = pi_status;
        this.player_status = player_status;
        this.is_activated = is_activated;
    }
}
