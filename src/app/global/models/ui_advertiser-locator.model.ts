export class UI_ADVERTISER_LOCATOR_MARKER {
	name: string;
	latitude: string;
	longitude: string;
	icon_url: string;

	constructor(name: string, lat: string, long: string, icon: string) {
		this.name = name;
		this.latitude = lat;
		this.longitude = long;
		this.icon_url = icon;
	}
}
