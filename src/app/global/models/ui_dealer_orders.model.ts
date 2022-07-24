export class UI_DEALER_ORDERS {
    index: object;
    date: object;
    order_no: object;
    dealer_alias: object;
    dealer_name: object;
    quantity: object;
    status: object;
    
    constructor(index: object, date: object, order_no: object, dealer_alias: object, dealer_name: object, quantity: object, status: object) {
        this.index = index;
        this.date = date;
        this.order_no = order_no;
        this.dealer_alias = dealer_alias;
        this.dealer_name = dealer_name;
        this.quantity = quantity;
        this.status = status;
    }
}