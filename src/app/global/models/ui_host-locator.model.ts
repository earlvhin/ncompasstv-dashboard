export class UI_HOST_LOCATOR_MARKER {
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

    constructor(
        hostId: string,
        name: string,
        lat: string,
        long: string,
        l_status: number,
        icon: string,
        address: string,
        category: string,
        storeHours: string,
        state: string,
        postalCode: string,
        city: string,
    ) {
        this.hostId = hostId;
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
    license_status?: number;
    iconUrl: string;
    address: string;
    category: string;
    generalCategory?: string;
    storeHours: string;
    state: string;
    postalCode: string;
    city: string;
    dealerId: string;

    constructor(
        id: string,
        name: string,
        lat: string,
        long: string,
        l_status: number,
        icon: string,
        address: string,
        category: string,
        storeHours: string,
        state: string,
        postalCode: string,
        city: string,
        dealerId: string,
    ) {
        this.hostId = id;
        this.name = name;
        this.latitude = lat;
        this.longitude = long;
        this.license_status = l_status;
        this.iconUrl = icon;
        this.address = address;
        this.category = category;
        this.storeHours = storeHours;
        this.state = state;
        this.postalCode = postalCode;
        this.city = city;
        this.dealerId = dealerId;
    }
}

export class UI_DEALER_LOCATOR_EXPORT {
    businessName: string;
    host: string;
    address: string;
    latitude: string;
    longitude: string;
    generalCategory?: string;
    category: string;
    storeHours: string;
    constructor(
        businessName: string,
        host: string,
        address: string,
        category: string,
        storeHours: string,
        latitude: string,
        longitude: string,
    ) {
        this.businessName = businessName;
        this.host = host;
        this.address = address;
        this.category = category;
        this.storeHours = storeHours;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
