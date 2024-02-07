export class API_UPDATE_ADVERTISER {
    id: string;
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
    status?: string;

    constructor(
        id: string,
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
        status?: string,
    ) {
        this.id = id;
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
        this.status = status;
    }
}
