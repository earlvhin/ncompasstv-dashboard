import { API_ADVERTISER, API_HOST, API_LICENSE_PROPS, TAG } from '.';
export class API_DEALER {
    activeHost: string;
    address?: string;
    advertisers: API_ADVERTISER[];
    businessName: string;
    city: string;
    contactNumber: string;
    contactPerson: string;
    contractDetails?: string;
    createdBy?: string;
    dateCreated: string;
    dateUpdated?: string;
    dealerId: string;
    dealerIdAlias: string;
    dealer?: any;
    dealerStats?: any;
    email?: string;
    forInstallationHost: number;
    generalCategory?: string;
    generatedId: string;
    hosts: API_HOST[];
    license?: any;
    licenses: API_LICENSE_PROPS[];
    logo?: string;
    monthAsDealer: string;
    offlineLicenseCount?: number;
    onlineLicenseCount?: number;
    owner?: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    playerCount: number;
    pendingLicenseCount?: number;
    region: string;
    startDate: string;
    state: string;
    status: string;
    tags: TAG[];
    totalAdvertisers: number;
    totalHost: string;
    totalOnlineLicense: number;
    updatedBy?: string;
    totalLicenseCount?: number;
    userId: string;
}

export interface API_DEALER_MINIFIED {
    dealerId: string;
    businessName: string;
    dealerIdAlias: string;
    status: string;
}
