export interface API_DEALER_VALUES {
    currentMonth: string;
    currentMonthLicenseCount: number;
    dealerValue: API_DEALER_VALUE;
    licensesDifference: number;
    totalLicenses: number;
}

export interface API_DEALER_VALUE {
    autoCharge: number;
    baseFee: number;
    billableLicenses: number;
    billing: number;
    billingDate: number;
    createdDate: string;
    dealerId: string;
    dealerValueId: string;
    email: string;
    licensePriceNew: string;
    month1: number;
    month19: number;
    month25: number;
    month31: number;
    month37: number;
    perLicense: number;
    stripeId: string;
    totalLicenses?: any;
    updatedDate: string;
}
