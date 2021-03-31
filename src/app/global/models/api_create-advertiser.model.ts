export class API_CREATE_ADVERTISER {
    dealerId: string;
    name: string;
    createdBy: string;
    latitude: string;
    longitude: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    region: string;
    // storeHours: any;
    category: string;

    constructor(dealerid: string, name: string, createdBy: string,
                latitude: string, longitude: string, address: string, city: string, 
                state: string, postalCode: string, 
                // storeHours: any, 
                category: string) {
        this.dealerId = dealerid;
        this.name = name;
        this.createdBy = createdBy;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.city = city;
        this.state = state;
        this.postalCode = postalCode;
        // this.region = region;
        // this.storeHours = storeHours;
        this.category = category;
    }
}
