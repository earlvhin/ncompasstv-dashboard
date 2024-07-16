import { BaseModel } from './base.model';
import { BaseApiResponse } from './base-api-response.model';

export interface ProgrammaticVendor extends BaseModel {
    name: string;
    description: string;
    apiUrl: string;
    vendorKeyValues?: ProgrammaticKeyValues[];
}
export interface GetProgrammaticVendors extends BaseApiResponse {
    data: ProgrammaticVendor[];
}

export interface GetProgrammaticVendor extends BaseApiResponse {
    data: ProgrammaticVendor;
}

export interface DeleteProgrammaticVendor extends BaseApiResponse {
    data: number;
}

class ProgrammaticKeyValues {
    key: string;
    value: string;
}
