import { API_ADVERTISER, API_DEALER, API_HOST, API_LICENSE, TAG } from '.';

export interface TAG_OWNER {
    owner: API_DEALER | API_HOST | API_LICENSE['license'] | API_ADVERTISER;
    ownerId: string;
    tagTypeId: string;
    tagTypeName: string;
    tags: TAG[];
    displayName?: string;
    url?: string;
}
