import { PAGING } from './paging.model';

export interface API_XML_DATA {
    id?: string;
    name?: string;
    dateCreated?: string;
    createdBy?: string;
    dateUpdated?: string | null;
    updatedBy?: string | null;
    status?: string;
    createdByName?: string;
    updatedByName?: string | null;
}
export interface API_XML_SETTINGS {
    status: string;
    message: string;
    data: {
        paging: PAGING;
    };
}
