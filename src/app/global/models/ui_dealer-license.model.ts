export class UI_DEALER_LICENSE {
    index: object;
    license_id: object;
    screenshot: object;
    license_key: object;
    host_name: object;
    alias: object;
    last_push: object;
    last_online: object;
    upload_speed: object;
    download_speed: object;
    display: object;
    anydesk: object;
    anydesk_password: object;
    screen: object;
    date_installed: object;
    date_requested: object;
    is_activated: object;
    is_assigned: object;
    pi_status: object;

    constructor(
        index: object,
        id: object,
        screenshot: object,
        key: object,
        host: object,
        alias: object,
        last_push: object,
        last_online: object,
        upload_speed: object,
        download_speed: object,
        display: object,
        anydesk: object,
        screen: object,
        date_installed: object,
        date_requested: object,
        is_activated: object,
        is_assigned: object,
        pi_status: object,
    ) {
        this.index = index;
        this.license_id = id;
        this.screenshot = screenshot;
        this.license_key = key;
        this.host_name = host;
        this.alias = alias;
        this.last_push = last_push;
        this.last_online = last_online;
        this.upload_speed = upload_speed;
        this.download_speed = download_speed;
        this.display = display;
        this.anydesk = anydesk;
        this.screen = screen;
        this.date_installed = date_installed;
        this.date_requested = date_requested;
        this.is_activated = is_activated;
        this.is_assigned = is_assigned;
        this.pi_status = pi_status;
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
    upload_speed: object;
    download_speed: object;
    display: object;
    anydesk: object;
    // password: object;
    date_installed: object;
    date_requested: object;
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
        upload_speed: object,
        download_speed: object,
        display: object,
        anydesk: object,
        // password: object,
        date_installed: object,
        date_requested: object,
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
        this.upload_speed = upload_speed;
        this.download_speed = download_speed;
        this.display = display;
        this.anydesk = anydesk;
        // this.password = password;
        this.date_installed = date_installed;
        this.date_requested = date_requested;
        this.pi_status = pi_status;
        this.player_status = player_status;
        this.is_activated = is_activated;
    }
}
