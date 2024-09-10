import { OWNER } from './owner.model';
import { TAG } from './tag.model';

export interface CREATE_AND_ASSIGN_TAG {
    tagtypeid: string;
    createdBy: string;
    owners: Owner[];
    new: TAG[];
    existing: string[];
}

export interface CREATE_AND_ASSIGN_TAG_V2 {
    tagtypeid: string;
    createdBy: string;
    owners: TAG_CREATORS[];
    new: TAG[];
    existing: string[];
}

export interface DELETE_TAG_BY_OWNER_ID_AND_TAG_WRAPPER {
    TagId: string;
    OwnerId: string;
    TagName: string;
    OwnerName: string;
}

export interface TAG_CREATORS {
    id: string;
    name: string;
}

class Owner {
    id: string;
    name: string;
}
