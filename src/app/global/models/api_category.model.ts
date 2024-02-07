import { API_HOST } from './api_host.model';

export interface API_CATEGORY {
    category?: string;
    categoryName?: string;
    count?: number;
    slug?: string;
    totalLicenses?: number;
    parentCategory?: string;
    hosts?: API_HOST[];
}
