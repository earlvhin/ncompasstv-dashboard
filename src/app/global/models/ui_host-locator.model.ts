export class UI_HOST_LOCATOR_MARKER {
	name: string;
	latitude: string;
	longitude: string;
	license_status: number;
	icon_url: string;

	constructor(name: string, lat: string, long: string, l_status: number, icon: string) {
		this.name = name;
		this.latitude = lat;
		this.longitude = long;
		this.license_status = l_status;
		this.icon_url = icon;
	}
}


export class UI_HOST_LOCATOR_MARKER_DEALER_MODE {
	hostId: string;
	name: string;
	latitude: string;
	longitude: string;
	license_status: number;
	icon_url: string;

	constructor(id: string, name: string, lat: string, long: string, l_status: number, icon: string) {
		this.hostId = id;
		this.name = name;
		this.latitude = lat;
		this.longitude = long;
		this.license_status = l_status;
		this.icon_url = icon;
	}
}
