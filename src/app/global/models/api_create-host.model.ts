export class API_CREATE_HOST {
	dealerId: string;
	businessName: string;
	createdBy: string;
	latitude: string;
	longitude: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	region: string;
	storeHours: any;
	category: string;
	timezone: string;
	logo?: string;
	images?: string[];

	constructor(
		dealerid: string,
		businessName: string,
		createdBy: string,
		latitude: string,
		longitude: string,
		address: string,
		city: string,
		state: string,
		postalCode: string,
		region: string,
		storeHours: any,
		category: string,
		timezone: string,
		logo: string
	) {
		this.dealerId = dealerid;
		this.businessName = businessName;
		this.createdBy = createdBy;
		this.latitude = latitude;
		this.longitude = longitude;
		this.address = address;
		this.city = city;
		this.state = state;
		this.postalCode = postalCode;
		this.region = region;
		this.storeHours = storeHours;
		this.category = category;
		this.timezone = timezone;
		this.logo = logo;
	}
}
