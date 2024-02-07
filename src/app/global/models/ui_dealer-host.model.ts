export class UI_DEALER_HOST {
    index: object;
    host_id: object;
    host_name: object;
    address: object;
    city: object;
    state: object;
    postal_code: object;
    license_count: object;
    status: object;
    // install_date: object;

    constructor(
        id: object,
        i: object,
        name: object,
        address: object,
        city: object,
        state: object,
        postal_code: object,
        license_count: object,
        status: object,
    ) {
        this.host_id = id;
        this.index = i;
        this.host_name = name;
        this.address = address;
        this.city = city;
        this.state = state;
        this.postal_code = postal_code;
        this.license_count = license_count;
        this.status = status;
        // this.install_date = install_date;
    }
}
