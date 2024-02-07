export class UI_TABLE_ADVERTISERS {
    id: object;
    index: object;
    name: object;
    region: object;
    city: object;
    state: object;
    status: object;

    constructor(
        id?: object,
        index?: object,
        name?: object,
        region?: object,
        city?: object,
        state?: object,
        status?: object,
    ) {
        this.id = id;
        this.index = index;
        this.name = name;
        this.region = region;
        this.city = city;
        this.state = state;
        this.status = status;
    }
}

export class DEALER_UI_TABLE_ADVERTISERS {
    id: object;
    index: object;
    name: object;
    region: object;
    state: object;
    status: any;
    assigned_user: object;
    constructor(
        id: object,
        index: object,
        name: object,
        region: object,
        state: object,
        status: object,
        assigned_user: object,
    ) {
        this.id = id;
        this.index = index;
        this.name = name;
        this.region = region;
        this.state = state;
        this.status = status;
        this.assigned_user = assigned_user;
    }
}
