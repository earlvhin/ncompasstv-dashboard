export class Installation {
	license_id: string;
	license_key: string;
	host: string;
	business: string;
	license_type: string;
	screen: string;
	installation_date: string;
	host_url?: string;
	dealer_url?: string;
	license_url?: string;
	screen_url?: string;

	constructor(
		id: string, 
		key: string,
		host: string,
		business: string,
		license_type: string,
		screen: string,
		installation_date: string
	) {
		this.license_id = id;
		this.license_key = key;
		this.business = business;
		this.host = host;
		this.license_type = license_type;
		this.screen = screen;
		this.installation_date = installation_date;
	}
	
}
