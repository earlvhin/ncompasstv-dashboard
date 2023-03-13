export class City {
    city: string;
    city_state: string;
    state: any;
    region?: any;
    whole_state?: any;

    constructor(city: string, city_state: string, state: any, region?: any, whole_state?: any) {
        this.city = city;
        this.city_state = city_state;
        this.state = state;
        this.region = region;
        this.whole_state = whole_state;
    }
}

export class State {
    state: string;
    abbreviation: string;
    region: string;

    constructor(state: string, abbreviation: string, region: string) {
        this.state = state;
        this.abbreviation = abbreviation;
        this.region = region;
    }
}