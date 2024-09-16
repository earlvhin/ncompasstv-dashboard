export interface DATA_TABLE {
    label: string[];
    data: DATA_TABLE_ROW[][];
    hasActions: {
        value: boolean;
        actions: { label: string; icon: string; action: string; title: string }[];
    };
}

export interface DATA_TABLE_ROW {
    value: any;
    isHidden: boolean;
    isLink?: boolean;
    externalLink?: string;
    insideLink?: string;
    newTab?: boolean;
    isTextTruncated?: boolean;
}
