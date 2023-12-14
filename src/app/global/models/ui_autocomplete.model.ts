export interface UI_AUTOCOMPLETE {
    label: string;
    placeholder: string;
    data: { id: string; value: any }[];
    disabled?: boolean;
}

export interface UI_AUTOCOMPLETE_DATA {
    id: string,
    value: any
}