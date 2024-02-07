import { count } from 'console';

export class UI_TABLE_FILLER_FEED {
    id: object;
    counter: object;
    name: object;
    quantity: object;
    interval: object;
    owner: object;
    group_count: object;
    created_date: object;

    constructor(
        id: object,
        counter: object,
        name: object,
        quantity: object,
        interval: object,
        owner: object,
        group_count: object,
        created_date: object,
    ) {
        this.id = id;
        this.counter = counter;
        this.name = name;
        this.quantity = quantity;
        this.interval = interval;
        this.owner = owner;
        this.group_count = group_count;
        this.created_date = created_date;
    }
}
