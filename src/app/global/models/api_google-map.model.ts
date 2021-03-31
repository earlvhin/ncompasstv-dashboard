export class API_GOOGLE_MAP {
    google_search: any;
    result: {
        formatted_address: string;
        geometry : {
            location: {
                lat: number;
                lng: number;
            }
        }
        opening_hours: {
            periods: any;
            weekday_text: any;
        }
        name: string;
        place_id: string;
        types: {}
    }
}
