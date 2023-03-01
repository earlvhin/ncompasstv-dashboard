import { TAG } from './tag.model';

export class API_ADVERTISER {
	address?: string;
	advertiserId: string;
	advertiserUser?: any;
	businessName?: string;
	category?: string;
	city?: string;
	createdBy: string;
	dateCreated: string;
	dateUpdated: string;
	dealerId: string;
	email: string;
	firstName: string;
	id: string;
	lastName: string;
	latitude?: string;
	longitude?: string;
	name: string;
	postalCode?: string;
	region: string;
	state: string;
	status: string;
	updatedBy: string;
	userId: string;
	tags?: TAG[];
	totalAssets?: number;
}
