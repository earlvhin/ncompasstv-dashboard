import { TAG } from './tag.model';

export interface CREATE_AND_ASSIGN_TAG {
    tagtypeid: string;
    createdBy: string;
    owners: owner[];
    new: TAG[];
    existing: string[];
}

class owner {
    id: string;
    name: string;
}
