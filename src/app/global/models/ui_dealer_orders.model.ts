export class UI_DEALER_ORDERS {
    index: any;
    date: any;
    order_no: any;
    dealer_alias: any;
    dealer_name: any;
    quantity: any;
    status: any;
    has_viewed: any;

    constructor(
        index: object,
        date: object,
        order_no: object,
        dealer_alias: object,
        dealer_name: object,
        quantity: object,
        status: object,
        has_viewed: any,
    ) {
        this.index = index;
        this.date = date;
        this.order_no = order_no;
        this.dealer_alias = dealer_alias;
        this.dealer_name = dealer_name;
        this.quantity = quantity;
        this.has_viewed = has_viewed;
        this.status = status;
    }
}
