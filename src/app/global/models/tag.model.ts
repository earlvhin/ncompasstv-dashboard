import { API_ADVERTISER, API_DEALER, API_HOST, API_LICENSE } from '.';

export interface TAG {
    advertiser?: API_ADVERTISER[];
    alias?: string;
    count?: number;
    dateCreated?: string;
    dealer?: API_DEALER[];
    description?: string;
    exclude?: number;
    host?: API_HOST[];
    isExisting?: boolean;
    isVerifyingExistence?: boolean;
    license?: API_LICENSE[];
    name: string;
    ownerId?: string;
    ownerName?: string;
    owners?: API_DEALER[] | API_HOST[] | API_LICENSE[] | API_ADVERTISER[];
    role?: number;
    tagColor?: string;
    tagId?: string;
    tagType?: string;
    tagTypeId?: number; // dealer: 1 | license: 2 | host: 3 | advertiser: 4
    updatedBy?: string;
}

export interface ADD_OWNER_RESPONSE {
    message: string;
    tags: {
        owners: {
            ownerId: string;
            tagTypeId: string;
            displayName: string;
        }[];
        tagIds: { tagId: string; name: string }[];
    };
}
export interface REMOVE_TAG_BY_ID_AND_OWNER_RESPONSE {
    message: string;
    tag: string;
}
