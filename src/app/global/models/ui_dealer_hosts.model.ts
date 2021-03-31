export class UI_DEALER_HOSTS {
    id: object;
    index: object;
    name: object;
    address: object;
    city:object;
    postal_code:object;
    totalLicenses: object;
    tag: object;
    status: object;

    constructor(id: object, index: object, name: object, address: object, city: object, postal_code: object, totalLicenses: object, tag: object, status: object, ) {
        this.id = id;
        this.index = index;
        this.name = name;
        this.address = address;
        this.city = city;
        this.postal_code = postal_code;
        this.totalLicenses = totalLicenses;
        this.tag = tag;
        this.status = status;
    }
}
