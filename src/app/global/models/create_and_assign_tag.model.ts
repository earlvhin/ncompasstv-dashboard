import { TAG_OWNER } from './tag-owner.model';
import { TAG } from './tag.model';

export interface CREATE_AND_ASSIGN_TAG {
    tagtypeid: string;
    createdBy: string;
    owners: string[];
    new: TAG[];
    existing: string[];
}

export interface CREATE_AND_ASSIGN_TAGS {
    tagtypeid: string;
    createdBy: string;
    owners: { id: string; name: string }[]; // Change to an array of objects
    new: TAG[];
    existing: string[];
}

export interface DELETE_TAG_BY_OWNER_ID_AND_TAG_WRAPPER {
    TagId: string;
    OwnerId: string;
    TagName: string;
    OwnerName: string;
}
