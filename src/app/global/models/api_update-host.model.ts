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

    constructor(hostData: {
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
        vistarVenueId: string;
        status: string;
    }) {
        this.hostId = hostData.hostId;
        this.dealerId = hostData.dealerId;
        this.name = hostData.name;
        this.latitude = hostData.latitude;
        this.longitude = hostData.longitude;
        this.city = hostData.city;
        this.state = hostData.state;
        this.postalCode = hostData.postalCode;
        this.region = hostData.region;
        this.address = hostData.address;
        this.category = hostData.category;
        this.storeHours = hostData.storeHours;
        this.timezone = hostData.timezone;
        this.vistarVenueId = hostData.vistarVenueId;
        this.status = hostData.status;
    }
}
