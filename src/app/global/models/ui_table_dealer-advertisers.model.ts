export class UI_DEALER_ADVERTISERS {
    dealer_id: object;
    index: object;
    dealer_alias: object;
    name: object;
    contact_person: object;
    // region: object;
    // city: object;
    // state: object;
    advertiser_count: object;

    constructor(
        id: object,
        index: object,
        dealer_alias: object,
        name: object,
        contact: object,
        advertiser_count: object,
    ) {
        this.dealer_id = id;
        this.index = index;
        this.dealer_alias = dealer_alias;
        this.name = name;
        this.contact_person = contact;
        // this.region = region;
        // this.city = city;
        // this.state = state;
        this.advertiser_count = advertiser_count;
    }
}
