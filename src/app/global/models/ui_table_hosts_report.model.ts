export class UI_TABLE_HOSTS {
    hostId: string;
    index: number;
    business_name: string;
    address: string;
    region: string;
    city: string;
    state: string;
    dateCreated: string;

    constructor(
        hostId:string, index: number, business_name: string,
        address: string, region: string, city: string, state: string, dateCreated: string
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
