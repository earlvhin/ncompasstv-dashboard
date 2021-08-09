import { Tag } from "./tag.model";

export class API_ADVERTISER {
    advertiserId: string;
    createdBy: string;
    dateCreated: string;
    dateUpdated: string;
    dealerId: string;
    email: string;
    firstName: string;
    id: string;
    lastName: string;
    name: string;
    region: string;
    state: string;
    status: string;
    updatedBy: string;
    userId: string;
	tags?: Tag[];
}