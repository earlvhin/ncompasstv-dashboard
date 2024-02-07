import { Time } from '@angular/common';

export class API_RESOURCE_DATA {
    resourceName: string;
    resourceDataCount?: API_RESOURCE_DATA_COUNT[];
}

export class API_RESOURCE_DATA_COUNT {
    dateTime: string;
    count: number;
}
