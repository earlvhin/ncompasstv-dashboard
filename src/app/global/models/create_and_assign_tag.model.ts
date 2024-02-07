import { TAG } from './tag.model';

export interface CREATE_AND_ASSIGN_TAG {
    tagtypeid: string;
    createdBy: string;
    owners: string[];
    new: TAG[];
    existing: string[];
}
