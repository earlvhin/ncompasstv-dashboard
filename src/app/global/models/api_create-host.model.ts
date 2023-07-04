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
		hostData: {
			dealerId: string,
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
			logo: string}
	) {
		this.dealerId = hostData.dealerId;
		this.businessName = hostData.businessName;
		this.createdBy = hostData.createdBy;
		this.latitude = hostData.latitude;
		this.longitude = hostData.longitude;
		this.address = hostData.address;
		this.city = hostData.city;
		this.state = hostData.state;
		this.postalCode = hostData.postalCode;
		this.region = hostData.region;
		this.storeHours = hostData.storeHours;
		this.category = hostData.category;
		this.timezone = hostData.timezone;
		this.logo = hostData.logo;
	}
}
