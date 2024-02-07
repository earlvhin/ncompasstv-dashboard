export class UI_TABLE_SCREEN {
    screen_id: object;
    counter: object;
    screen_name: object;
    dealer_name: object;
    host_name: object;
    type: object;
    template: object;
    created_by: object;
    date_created: object;
    last_update: object;

    constructor(
        id: object,
        count: object,
        name: object,
        dealer: object,
        host: object,
        type: object,
        template: object,
        user: object,
        date: object,
        last_update: object,
    ) {
        this.screen_id = id;
        this.counter = count;
        this.screen_name = name;
        this.dealer_name = dealer;
        this.host_name = host;
        this.type = type;
        this.template = template;
        this.created_by = user;
        this.date_created = date;
        this.last_update = last_update;
    }
}

export class UI_DEALER_TABLE_SCREEN {
    screen_id: object;
    counter: object;
    screen_name: object;
    screen_type: object;
    host_name: object;
    template: object;
    created_by: object;
    date_created: object;

    constructor(
        id: object,
        count: object,
        name: object,
        screen_type: object,
        host: object,
        template: object,
        user: object,
        date: object,
    ) {
        this.screen_id = id;
        this.counter = count;
        this.screen_name = name;
        this.screen_type = screen_type;
        this.host_name = host;
        this.template = template;
        this.created_by = user;
        this.date_created = date;
    }
}
