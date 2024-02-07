export class INSTALLATION {
    license_id: object;
    index: object;
    license_key: object;
    host: object;
    dealer_alias: object;
    dealer_name: object;
    license_type: object;
    installation_date: object;

    constructor(
        id: object,
        index: object,
        key: object,
        host: object,
        dealer_alias: object,
        dealer_name: object,
        license_type: object,
        installation_date: object,
    ) {
        this.license_id = id;
        this.index = index;
        this.license_key = key;
        this.host = host;
        this.dealer_alias = dealer_alias;
        this.dealer_name = dealer_name;
        this.license_type = license_type;
        this.installation_date = installation_date;
    }
}
