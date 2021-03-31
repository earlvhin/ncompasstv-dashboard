export class UI_DEALER_LICENSE {
    index: object;
    license_id: object;
    license_key: object;
    alias: object;
    screen_type: object;
    host_name: object;
	connection_speed: object;
    connection_type: object;
    date_created: object;
    is_activated: object;
    is_assigned: object;
	pi_status: object;
	date_installed: object;
	last_push: object;
	last_online: object;
	anydesk: object;
	template: object;
	type: object;

    constructor(id: object, key: object, type: object, host: object, alias: object, last_push: object, last_online: object, 
		connection_type: object, connection_speed: object, anydesk: object, template: object, date_installed: object, 
		date_created: object, is_activated: object, is_assigned: object, pi_status: object) {

		this.license_id = id;
        this.license_key = key;
		this.type = type;
        this.host_name = host;
		this.alias = alias;
        this.last_push = last_push;
		this.last_online = last_online;
		this.connection_type = connection_type;
		this.connection_speed = connection_speed;
		this.anydesk = anydesk;
		this.template = template;
		this.date_installed = date_installed;
        this.date_created = date_created;
        this.is_activated = is_activated;
        this.is_assigned = is_assigned;
        this.pi_status = pi_status;
    }
}
