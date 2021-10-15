export class UI_HOST_LICENSE {
    license_id: object;
    index: object;
    license_key: object;
    alias: object;
    type: object;
    screen: object;
    mac_address: object;
    internet_type: object;
    internet_speed: object;
    last_push_update: object;
    online_status: object;
    offline_status: object;
    pi_status: object;
	install_date: object;

    constructor(
        license_id: object, index: object, license_key: object, alias: object, type: object, screen: object, mac_address: object, 
		internet_type: object, internet_speed: object, last_push_update: object, online_status: object, offline_status: object,
		install_date: object, pi_status: object, 
    ) {
        this.license_id = license_id;
        this.index = index;
        this.license_key = license_key;
        this.alias = alias;
        this.type = type;
        this.screen = screen;
        this. mac_address = mac_address;
        this.internet_type = internet_type;
        this.internet_speed = internet_speed;
        this.last_push_update = last_push_update;
        this.online_status = online_status;
        this.offline_status = offline_status;
		this.install_date = install_date;
        this.pi_status = pi_status;
    }
}


export class UI_HOST_VIEW {
    index: object;
    host_id: object;
    name: object;
    business_name: object;
    address: object;
    city: object;
    region: object;
    state: object;
    street: object;
    postal_code: object;
    timezone_name: object;
    total_licenses: object;
    constructor(
       index: object, host_id: object, name: object, business_name: object, address: object, city: object, region: object, state: object, street: object, postal_code: object, timezone_name: object, total_licenses: object
    ) {
        this.index = index;
        this.host_id = host_id;
        this.name = name;
        this.business_name = business_name;
        this.address = address;
        this.city = city;
        this.region = region;
        this.state = state;
        this.street = street;
        this.postal_code = postal_code;
        this.timezone_name = timezone_name;
        this.total_licenses = total_licenses;
    }
}
