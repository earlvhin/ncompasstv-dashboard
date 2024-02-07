export interface UI_CREDIT_CARD_DETAILS {
    cardid?: string;
    dealerId: string;
    email: string;
    Email?: string; // this is intentional
    Name: string;
    Number: string;
    ExpirationYear: number | string;
    ExpirationMonth: number | string;
    Cvc: number;
    AddressLine1?: string;
    AddressLine2?: string;
    AddressCity?: string;
    AddressCountry?: string;
    AddressState?: string;
    AddressZip?: string;
}
