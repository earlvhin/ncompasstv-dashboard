export class UI_TABLE_DEALERS {
    dealer_id: string;
    user_id:string;
    dealer_id_alias: string;
    business_name: string;
    business_owner: string;
    contact_person: string;
    region: string;
    state: string;
    months_as_dealer: number;
    l_total: number;
    l_inactive: number;
    l_online: number;
    l_offline: number;
    h_scheduled: number;
    h_total: number;
    h_active: number;
    a_total: number;
    a_active: number;

    constructor(
        dealer_id: string, user_id: string, dealer_id_alias: string, business_name: string, business_owner: string,
        contact_person: string, region: string, state: string, months_as_dealer: number,
        l_total: number, l_inactive: number, l_online: number, l_offline: number,
        h_scheduled: number, h_total: number, h_active: number,
        a_total: number, a_active: number
    ) {
        this.dealer_id = dealer_id;
        this.user_id = user_id;
        this.dealer_id_alias = dealer_id_alias;
        this.business_name = business_name;
        this.business_owner = business_owner;
        this.contact_person = contact_person;
        this.region = region;
        this.state = state;
        this.months_as_dealer = months_as_dealer;
        this.l_total = l_total;
        this.l_inactive = l_inactive;
        this.l_online = l_online;
        this.l_offline = l_offline;
        this.h_scheduled = h_scheduled;
        this.h_total = h_total;
        this.h_active = h_active;
        this.a_total = a_total;
        this.a_active = a_active;
    }
}

export class UI_TABLE_DEALERS_REPORT {
	dealer_id: object;
    index: object;
    business_name: object;
    business_owner: object;
    contact_person: object;
    region: object;
	state: object;
	dateCreated: object;
	
	constructor(
        dealer_id: object, index: object, business_name: object, business_owner: object,
        contact_person: object, region: object, state: object, date: object
    ) {
		this.dealer_id = dealer_id;
        this.index = index;
        this.business_name = business_name;
        this.business_owner = business_owner;
        this.contact_person = contact_person;
        this.region = region;
		this.state = state;
		this.dateCreated = date;
    }
}
