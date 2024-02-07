export interface API_EXPORT_DEALER {
    businessName: string;
    contactPerson: string;
    dateCreated: string;
    dealerId: string;
    dealerIdAlias: string;
    monthAsDealer: string;
    playerCount: number;
    tags: string[];
    tagsToString?: string;
    totalAdvertisers: number;
    totalAdvertisersActive: number;
    totalHosts: number;
    totalHostsActive: number;
    totalLicenses: number;
    totalLicensesInactive: number;
    totalLicensesOffline: number;
    totalLicensesOnline: number;
    totalScheduled: number;
}
