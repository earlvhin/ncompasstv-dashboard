import { API_ADVERTISER, API_DEALER, API_HOST, API_LICENSE } from '.';

export interface TAG {
	name: string;
	tagId: string;
	tagColor: string;
	count?: number;
	dealer?: API_DEALER[];
	host?: API_HOST[];
	license?: API_LICENSE[];
	advertiser?: API_ADVERTISER[];
	owners?: API_DEALER[] | API_HOST[] | API_LICENSE[] | API_ADVERTISER[];
	tagType?: string;
	alias?: string;
	dateCreated?: string;
	ownerId?: string;
	ownerName?: string;
	tagTypeId?: number;
}
