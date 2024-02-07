export class UI_TABLE_HOSTS {
    hostId: object;
    index: object;
    business_name: object;
    address: object;
    region: object;
    city: object;
    state: object;
    dateCreated: object;

    constructor(
        hostId: object,
        index: object,
        business_name: object,
        address: object,
        region: object,
        city: object,
        state: object,
        dateCreated: object,
    ) {
        this.hostId = hostId;
        this.index = index;
        this.business_name = business_name;
        this.address = address;
        this.region = region;
        this.city = city;
        this.state = state;
        this.dateCreated = dateCreated;
    }
}
