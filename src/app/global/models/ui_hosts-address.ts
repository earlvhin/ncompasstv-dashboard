export class UI_HOST_ADDRESS{
    city?: string;
    state?: string;
    region?: string;
    country?: string;

    constructor(
        city: string,
        state: string,
        region: string,
        country: string,
    ) {
        this.city = city;
        this.state = state;
        this.region = region;
        this.country = country;
    }
}
