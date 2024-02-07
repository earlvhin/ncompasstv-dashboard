import { TAG, UI_STORE_HOUR } from '.';

export interface API_DMA {
    dmaCode: string;
    dmaName: string;
    dmaRank: number;
    totalHosts: number;
    hosts?: API_DMA_HOST[];
}

export interface API_DMA_HOST {
    address: string;
    category: string;
    county: string;
    dmaCode: string;
    dmaName: string;
    dmaRank: number;
    hostId: string;
    hostName: string;
    latitude: string;
    longitude: string;
    mappedStoreHours: string;
    storeHours: string;
    storeHoursParsed?: UI_STORE_HOUR[];
    storeHoursTotal?: string;
    tags?: TAG[];
    tagsToString?: string;
    zip: string;
}
