import { API_HOST } from './api_host.model';
import { API_LICENSE_PROPS } from './api_license.model';

export class API_DEALER {
    dealers: Array<any>;
    dealer: any;
    dealerId: string;
    dealerIdAlias: string;
    businessName: string;
    contactPerson: string;
    contactNumber: string;
    region: string;
    state: string;
    city: string;
    userId: string;
    dateCreated: string;
    dateUpdated: string;
    createdBy: string;
    updatedBy: string;
    status: string;
    totalHost: number;
    activeHost: number;
    forInstallationHost: number;
    email: string;
    generatedId: string;
    hosts: Array<API_HOST>;
    licenses: API_LICENSE_PROPS[];
    monthAsDealer: number;
    ownerFirstName: string;
    ownerLastName: string;
    owner: string;
    contractDetails: string;
	advertisers: any;
	tags: { dateCreated: string, name: string, ownerId: string, tagId: number, tagTypeId: number }[];
    onlineLicenseCount?: number = 0;
    offlineLicenseCount?: number = 0;
}
