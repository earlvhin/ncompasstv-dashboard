import { API_HOST } from '.';

export interface API_STATE {
    state: string;
    count: number;
    hosts?: API_HOST[];
    totalLicenses?: number;
}
