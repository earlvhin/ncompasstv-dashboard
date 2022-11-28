export class API_UPDATE_HOST {
	hostId: string;
	dealerId: string;
	name: string;
	latitude: string;
	longitude: string;
	city: string;
	state: string;
	postalCode: string;
	region: string;
	address: string;
	category: string;
	storeHours: string;
	timezone: string;
	notes?: string;
	others?: string;
	vistarVenueId: string;
	status = 'A' || 'I';

	constructor(
		hostId: string,
		dealerId: string,
		name: string,
		latitude: string,
		longitude: string,
		city: string,
		state: string,
		postalCode: string,
		region: string,
		address: string,
		category: string,
		storeHours: string,
		timezone: string,
		vistar_venue_id: string,
		status: string
	) {
		this.hostId = hostId;
		this.dealerId = dealerId;
		this.name = name;
		this.latitude = latitude;
		this.longitude = longitude;
		this.city = city;
		this.state = state;
		this.postalCode = postalCode;
		this.region = region;
		this.address = address;
		this.category = category;
		this.storeHours = storeHours;
		this.timezone = timezone;
		this.vistarVenueId = vistar_venue_id;
		this.status = status;
	}
}
