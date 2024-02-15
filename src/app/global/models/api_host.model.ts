import { API_LICENSE_PROPS, API_TIMEZONE, TAG, UI_STORE_HOUR } from '.';
import { API_DEALER } from './api_dealer.model';

export class API_HOST {
    address: string;
    avgDwellTime: string;
    avgTicket: string;
    businessName: string;
    category: string;
    city: string;
    country: string;
    createdBy: string;
    dateCreated: string;
    dateUpdated: string;
    dealerId: string;
    demographics: string;
    generalCategory?: string;
    groupId: string;
    host?: any[];
    hostAddress?: string;
    hostId: string;
    hostName: string;
    installDate: string;
    internet: string;
    latitude: string;
    licenses: API_LICENSE_PROPS[];
    logo?: string;
    longitude: string;
    mappedStoreHours?: string;
    monthlyTraffic: string;
    name: string;
    notes: string;
    others?: any;
    postalCode: string;
    region: string;
    state: string;
    status: string;
    storeHours: any;
    storeHoursTotal?: any;
    storeHoursParsed?: UI_STORE_HOUR[];
    street: string;
    tags?: TAG[];
    tagsToString?: string;
    totalLicenses: number;
    totalLicensesPending?: number;
    totalLicences: number;
    timeZone: string; // do not be fooled like me, this is actually the timezone id
    timeZoneData?: API_TIMEZONE; // added this one bec this makes more sense than separating the timezone object
    timezoneName?: string;
    updatedBy: string;
    userId: string;
    venueType: string;
    vistarVenueId: any;
    parsedStoreHours?: any;
    iconUrl?: string;
    contactPerson: string;
    contactNumber: string;
}

export class API_SINGLE_HOST {
    host: API_HOST;
    timezone?: API_TIMEZONE;
    dealer?: API_DEALER;
    hostTags?: TAG[];
    dealerTags?: TAG[];
    fieldGroups?: any[];
    createdBy?: any[];
}
export class API_CREATE_SUPPORT {
    hostId: string;
    notes: string;
    url: string;
    createdBy: string;

    constructor(hostId: string, notes: string, url: string, createdBy: string) {
        this.hostId = hostId;
        this.notes = notes;
        this.url = url;
        this.createdBy = createdBy;
    }
}

export class API_USER_HOST {
    hostId: string;
    dealerId: string;
    userId: string;
    name: string;
    address: string;
    street: string;
    city: string;
    postalCode: string;
    region: string;
    state: string;
    country: string;
    groupId?: string;
    latitude: string;
    longitude: string;
    timeZone: string;
    storeHours: string;
    venueType: any;
    monthlyTraffic: string;
    avgDwellTime: string;
    avgTicket: string;
    demographics: string;
    internet: string;
    notes: string;
    installDate: string;
    dateCreated: string;
    dateUpdated?: string;
    createdBy: string;
    updatedBy?: string;
    status: string;
    category?: string;
    vistarVenueId?: string;
    others?: string;
    logo?: string;
}

export interface API_HOST_MINIFIED {
    hostId: string;
    name: string;
    address: string;
    city: string;
    longitude: string;
    latitude: string;
    dateCreated: string;
}
