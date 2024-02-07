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
