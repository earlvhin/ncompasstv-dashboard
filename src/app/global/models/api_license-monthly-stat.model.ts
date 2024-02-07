export interface API_LICENSE_MONTHLY_STAT {
    dealers: { businessName: string; dealerId: string; totalLicenses: number }[];
    month: number;
    totalLicenses: number;
    year: number;
}
