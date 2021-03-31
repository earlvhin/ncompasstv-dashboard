export class City {
    city: string;
    city_state: string;
    state: any;

    constructor(city: string, city_state: string, state: any) {
        this.city = city;
        this.city_state = city_state;
        this.state = state;
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