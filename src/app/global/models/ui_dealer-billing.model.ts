export class UI_DEALER_BILLING {
    index: object;
    dealer_id: object;
    dealer_id_alias: object;
    dealer_name: object;
    total_licenses: object;
    billable_licenses: object;
    price_per_license: object;
    new_license_price: object;
    base_fee: object;
    billing: object;
    billing_date: object;
    autocharge: object;

    constructor(
        index: object,
        dealer_id: object,
        dealer_id_alias: object,
        dealer_name: object,
        total_licenses: object,
        billable_licenses: object,
        price_per_license: object,
        new_license_price: object,
        base_fee: object,
        billing: object,
        billing_date: object,
        autocharge: object,
    ) {
        this.index = index;
        this.dealer_id = dealer_id;
        this.dealer_id_alias = dealer_id_alias;
        this.dealer_name = dealer_name;
        this.total_licenses = total_licenses;
        this.billable_licenses = billable_licenses;
        this.price_per_license = price_per_license;
        this.new_license_price = new_license_price;
        this.base_fee = base_fee;
        this.billing = billing;
        this.billing_date = billing_date;
        this.autocharge = autocharge;
    }
}
