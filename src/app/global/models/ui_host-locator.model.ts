export class UI_HOST_LOCATOR_MARKER {
	name: string;
	latitude: string;
	longitude: string;
	license_status: number;
	icon_url: string;
	address: string;
	category: string;
	storeHours: string;
	state: string;
	postalCode: string;
	city: string;

	constructor(name: string, lat: string, long: string, l_status: number, icon: string,
				address: string, category: string, storeHours: string, state: string, 
				postalCode: string, city: string) {
		this.name = name;
		this.latitude = lat;
		this.longitude = long;
		this.license_status = l_status;
		this.icon_url = icon;
		this.address = address;
		this.category = category;
		this.storeHours = storeHours;
		this.state = state;
		this.postalCode = postalCode;
		this.city = city;
	}
}


export class UI_HOST_LOCATOR_MARKER_DEALER_MODE {
	hostId: string;
	name: string;
	latitude: string;
	longitude: string;
	license_status: number;
	icon_url: string;
	address: string;
	category: string;
	storeHours: string;
	state: string;
	postalCode: string;
	city: string;

	constructor(id: string, name: string, lat: string, long: string, l_status: number, icon: string,
				address: string, category: string, storeHours: string, state: string, 
				postalCode: string, city: string) {
		this.hostId = id;
		this.name = name;
		this.latitude = lat;
		this.longitude = long;
		this.license_status = l_status;
		this.icon_url = icon;
		this.address = address;
		this.category = category;
		this.storeHours = storeHours;
		this.state = state;
		this.postalCode = postalCode;
		this.city = city;
	}
}


export class UI_DEALER_LOCATOR_EXPORT {
	name: string;
	address: string;
	latitude: string;
	longitude: string;
	category: string;
	storeHours: string;
	constructor(name: string, address: string, category: string, storeHours: string, latitude: string, longitude: string){
		this.name = name;
		this.address = address;
		this.category = category;
		this.storeHours = storeHours;
		this.latitude = latitude;
		this.longitude = longitude;
	}
}