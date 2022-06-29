export class UI_DEALER_TRANSACTIONS {
    index: object;
    date: object;
    order_no: object;
    transaction: object;
    description: object;
    price: object;
    status: object;
    link: object;
    
    constructor(index: object, date: object, order_no: object, transaction: object, description: object, price: object, status: object, link:object) {
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
