export class UI_ADVERTISER_LOCATOR_MARKER {
    name: string;
    latitude: string;
    longitude: string;
    icon_url: string;
    address: string;
    category: string;
    storeHours: string;
    state: string;
    postalCode: string;
    city: string;

    constructor(
        name: string,
        lat: string,
        long: string,
        icon: string,
        address: string,
        category: string,
        storeHours: string,
        state: string,
        postalCode: string,
        city: string,
    ) {
        this.name = name;
        this.latitude = lat;
        this.longitude = long;
        this.icon_url = icon;
        this.address = address;
        this.category = category;
        this.storeHours = storeHours;
        this.state = state;
        this.postalCode = postalCode;
        this.city = city;
    }
}
