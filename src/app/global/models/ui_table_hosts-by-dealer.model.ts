export class UI_TABLE_HOSTS_BY_DEALER {
    dealer_id: object;
    index: object;
    dealer_alias: object;
    business_name: object;
    contact_person: object;
    // region: object;
    // city: object;
    // state: object;
    host_count: object;
    active: object;
    to_install: object;
    recently_added_host: object;

    constructor(
        dealer_id: object,
        index: object,
        dealer_alias: object,
        business_name: object,
        contact_person: object,
        host_count: object,
        active: object,
        to_install: object,
        recently_added_host: object,
    ) {
        this.dealer_id = dealer_id;
        this.index = index;
        this.dealer_alias = dealer_alias;
        this.business_name = business_name;
        this.contact_person = contact_person;
        // this.region = region;
        // this.city = city;
        // this.state = state;
        this.host_count = host_count;
        this.active = active;
        this.to_install = to_install;
        this.recently_added_host = recently_added_host;
    }
}
