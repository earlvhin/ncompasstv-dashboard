export interface API_CREDIT_CARD_DETAILS {
    account: any;
    address_city: string;
    address_country: string;
    address_line1: string;
    address_line1_check: any;
    address_line2: string;
    address_state: string;
    address_zip: string;
    address_zip_check: any;
    available_payout_methods: any;
    brand: string;
    country: string;
    currency: any;
    customer: string;
    cvc_check: string;
    default_for_currency: any;
    description: any;
    dynamic_last4: any;
    email?: string;
    exp_month: number;
    exp_year: number;
    fingerprint: string;
    funding: string;
    id: string;
    iin: any;
    issuer: any;
    last4: string;
    metadata: any;
    name: string;
    object: any;
    status: any;
    tokenization_method: any;
}
