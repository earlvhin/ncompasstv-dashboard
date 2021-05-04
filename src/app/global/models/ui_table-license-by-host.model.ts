export class UI_TABLE_LICENSE_BY_HOST {
    license_id: object;
    host_id: object;
    index: object;
    screenshot: object;
    license_key: object;
    alias: object;
    screen_type: object;
    name: object;
    category: object;
    region: object;
    city: object;
    state: object;
    connection_type: object;
    screen: object;
    create_date: object;
	install_date: object;
    contents_updated: object;
    status: object;
    pi_status: object;

    constructor(
        license_id: object, host_id: object, index: object, screenshot: object, license_key: object, alias: object, screen_type: object,
        name: object, category: object, region: object, city: object, state: object, connection_type: object, screen: object, 
		create_date: object, install_date: object, contents_updated: object, status: object, pi_status: object
    ) {
        this.license_id = license_id;
        this.host_id = host_id;
        this.index = index;
        this.screenshot = screenshot;
        this.license_key = license_key;
        this.alias = alias;
        this.screen_type = screen_type;
        this.name = name;
        this.category = category;
        this.region = region;
        this.city = city;
        this.state = state;
        this.connection_type = connection_type;
        this.screen = screen;
        this.create_date = create_date;
		this.install_date = install_date;
        this.contents_updated = contents_updated;
        this.status = status;
        this.pi_status = pi_status;
    }
}
