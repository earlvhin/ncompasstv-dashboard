import { TAG } from './tag.model';

export interface CREATE_AND_ASSIGN_TAG {
    tagtypeid: string;
    createdBy: string;
    owners: owner[];
    new: TAG[];
    existing: string[];
}

export interface CREATE_AND_ASSIGN_TAG_V2 {
    tagtypeid: string;
    createdBy: string;
    owners: TagOwner[];
    new: TAG[];
    existing: string[];
}

export interface DELETE_TAG_BY_OWNER_ID_AND_TAG_WRAPPER {
    TagId: string;
    OwnerId: string;
    TagName: string;
    OwnerName: string;
}

export interface TagOwner {
    id: string;
    name: string;
}

class owner {
    id: string;
    name: string;
}
