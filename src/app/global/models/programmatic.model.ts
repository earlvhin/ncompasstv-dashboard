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

export interface GetProgrammaticVendorsIdAndNames extends BaseApiResponse {
    data: [
        {
            id: string;
            name: string;
        },
    ];
}

export interface ToggleProgrammaticVendorResponse extends BaseApiResponse {
    data: boolean;
}

export interface GetHostDisabledProgrammatics extends BaseApiResponse {
    data: [];
}

export interface DeleteProgrammaticVendor extends BaseApiResponse {
    data: number;
}

export class ProgrammaticKeyValues {
    key: string;
    value: string;
}

export interface VendorsIdAndNames {
    id: string;
    name: string;
}

export interface ToggleProgrammaticVendor {
    programmaticId: string;
    hostId: string;
}
