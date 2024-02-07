export class UI_DEALER_TRANSACTIONS {
    index: object;
    date: object;
    order_no: object;
    transaction: object;
    description: object;
    price: object;
    status: object;
    link: object;

    constructor(
        index: object,
        date: object,
        order_no: object,
        transaction: object,
        description: object,
        price: object,
        status: object,
        link: object,
    ) {
        this.index = index;
        this.date = date;
        this.order_no = order_no;
        this.transaction = transaction;
        this.description = description;
        this.price = price;
        this.status = status;
        this.link = link;
    }
}

export class UI_DEALER_INVOICE_TRANSACTIONS {
    index: object;
    dealer_alias: object;
    dealer_name: object;
    total_bill: object;
    billing_date: object;
    status: object;
    link: object;

    constructor(
        index: object,
        dealer_alias: object,
        dealer_name: object,
        total_bill: object,
        billing_date: object,
        status: object,
        link: object,
    ) {
        this.index = index;
        this.dealer_alias = dealer_alias;
        this.dealer_name = dealer_name;
        this.total_bill = total_bill;
        this.billing_date = billing_date;
        this.status = status;
        this.link = link;
    }
}
