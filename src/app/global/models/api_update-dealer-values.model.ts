export class API_UPDATE_DEALER_VALUES {
    dealerId: string;
    month1: string;
    month19: string;
    month25: string;
    month31: string;
    month37: string;
    baseFee: number;
    perLicense: number;
    billing: number;

    constructor(
        dealerId: string,
        month1: string,
        month19: string,
        month25: string,
        month31: string,
        month37: string,
        baseFee: number,
        perLicense: number,
        billing: number,
    ) {
        this.dealerId = dealerId;
        this.month1 = month1;
        this.month19 = month19;
        this.month25 = month25;
        this.month31 = month31;
        this.month37 = month37;
        this.baseFee = baseFee;
        this.perLicense = perLicense;
        this.billing = billing;
    }
}
