export class API_CREATE_ADVERTISER {
	dealerId: string;
	name: string;
	createdBy: string;
	latitude: string;
	longitude: string;
	address: string;
	city: string;
	state: string;
	region: string;
	postalCode: string;
	category: string;
	logo?: string;
	images?: string[];

	constructor(
		dealerid: string,
		name: string,
		createdBy: string,
		latitude: string,
		longitude: string,
		address: string,
		city: string,
		state: string,
		region: string,
		postalCode: string,
		// storeHours: any,
		category: string,
		logo: string
	) {
		this.dealerId = dealerid;
		this.name = name;
		this.createdBy = createdBy;
		this.latitude = latitude;
		this.longitude = longitude;
		this.address = address;
		this.city = city;
		this.state = state;
		this.region = region;
		this.postalCode = postalCode;
		// this.storeHours = storeHours;
		this.category = category;
		this.logo = logo;
	}
}
