export class UI_TABLE_LICENSE_BY_DEALER {
    dealer_id: object;
    index: object;
    dealer_alias: object;
    business_name: object;
    contact_person: object;
    region: object;
    city: object;
    state: object;
    total: object;
    active: object;
    inactive: object;
    online: object;
    offline: object;
    recent_purchase_date: object;
    purchase_quantity: object;

    constructor(
        dealer_id: object,
        index: object,
        dealer_alias: object,
        business_name: object,
        contact_person: object,
        region: object,
        city: object,
        state: object,
        total: object,
        active: object,
        inactive: object,
        online: object,
        offline: object,
        recent_purchase_date: object,
        purchase_quantity: object,
    ) {
        this.dealer_id = dealer_id;
        this.index = index;
        this.dealer_alias = dealer_alias;
        this.business_name = business_name;
        this.contact_person = contact_person;
        this.region = region;
        this.city = city;
        this.state = state;
        this.total = total;
        this.active = active;
        this.inactive = inactive;
        this.online = online;
        this.offline = offline;
        this.recent_purchase_date = recent_purchase_date;
        this.purchase_quantity = purchase_quantity;
    }
}
