import { Observable } from 'rxjs';

export interface UI_AUTOCOMPLETE {
    label: string;
    placeholder: string;
    data: UI_AUTOCOMPLETE_DATA[];
    disabled?: boolean;
    allowSearchTrigger?: boolean;
    initialValue?: UI_AUTOCOMPLETE_DATA[];
    noData?: any;
    unselect?: boolean;
    trigger?: Observable<any>;
}

export interface UI_AUTOCOMPLETE_DATA {
    id: any;
    value: any;
    display?: any;
}

export interface UI_CITY_AUTOCOMPLETE extends UI_AUTOCOMPLETE {
    data: UI_CITY_AUTOCOMPLETE_DATA[];
}

export interface UI_CITY_AUTOCOMPLETE_DATA extends UI_AUTOCOMPLETE_DATA {
    country: string;
}

export interface UI_AUTOCOMPLETE_INITIAL_DATA {
    id: string;
    value: string;
}

export interface MAPPED_CITY {
    id: number;
    value: string;
    city: string;
    display: string;
    country: string;
    state: string;
    region: string;
}
