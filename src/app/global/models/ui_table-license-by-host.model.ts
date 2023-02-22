export class UI_TABLE_LICENSE_BY_HOST {
    license_id: object;
    host_id: object;
    index: object;
    screenshot: object;
    license_key: object;
    screen_type: object;
    name: object;
    alias: object;
    contents_updated: object;
    time_in: object;
    connection_type: object;
    connection_speed: object;
    anydesk_id: object;
    // anydesk_password: object;
    display: object;
    install_date: object;
    create_date: object;
    pi_status: object;
	player_status: object;
    is_activated?: object;

    constructor(
        license_id: object, host_id: object, index: object, screenshot: object, license_key: object, screen_type: object,
        name: object, alias: object, contents_updated: object, time_in: object, connection_type: object, connection_speed: object,  
        anydesk_id: object, 
        // anydesk_password: object, 
        display: object, install_date: object, create_date: object, pi_status: object, player_status: object,
		is_activated?: object
    ) {
        this.license_id = license_id;
        this.host_id = host_id;
        this.index = index;
        this.screenshot = screenshot;
        this.license_key = license_key;
        this.screen_type = screen_type;
        this.name = name;
        this.alias = alias;
        this.contents_updated = contents_updated;
        this.time_in = time_in;
        this.connection_type = connection_type;
        this.connection_speed = connection_speed;
        this.anydesk_id = anydesk_id;
        // this.anydesk_password = anydesk_password;
        this.display = display;
        this.install_date = install_date;
        this.create_date = create_date;
        this.pi_status = pi_status;
		this.player_status = player_status;
        this.is_activated = is_activated;
    }
}