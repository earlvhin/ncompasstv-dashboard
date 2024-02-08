export class UI_OPERATION_DAYS {
    id: number;
    label: string;
    day: string;
    periods: UI_OPERATION_HOURS[];
    status: boolean;

    constructor(id: number, label: string, day: string, periods: UI_OPERATION_HOURS[], status: boolean) {
        this.id = id;
        this.label = label;
        this.day = day;
        this.periods = periods;
        this.status = status;
    }
}

export class UI_OPERATION_HOURS {
    id: number;
    day_id: number;
    open: string;
    close: string;

    constructor(id: number, day_id: number, open: string, close: string) {
        this.id = id;
        this.day_id = day_id;
        this.open = open;
        this.close = close;
    }
}
