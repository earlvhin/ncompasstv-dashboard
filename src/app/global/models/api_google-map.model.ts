export class API_GOOGLE_MAP {
    google_search: GOOGLE_MAP_SEARCH_RESULT[];
    result: {
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        opening_hours: {
            periods: any;
            weekday_text: any;
        };
        name: string;
        place_id: string;
        types: {};
    };
}

export interface GOOGLE_MAP_SEARCH_RESULT {
    html_attributions: string[];
    result: {
        adr_address: string;
        formatted_address: string;
        formatted_phone_number: string;
        geometry: {
            location: { lat: number; lng: number };
            viewport: {
                northeast: { lat: number; lng: number };
                southwest: { lat: number; lng: number };
            };
        };
        icon: string;
        name: string;
        opening_hours: {
            open_now: boolean;
            periods: {
                close: { day: number; time: number };
                open: { day: number; time: number };
            }[];
            weekday_text: string[];
        };
        photos: {
            height: number;
            html_attributions: string[];
            photo_reference: string;
            width: number;
        }[];
        place_id: string;
        rating: number;
        reviews: {
            author_name: string;
            author_url: string;
            language: string;
            profile_photo_url: string;
            rating: number;
            relative_time_description: string;
            text: string;
            time: number;
        }[];
        types: string[];
    };
    status: string;
}

export interface GOOGLE_MAP_SEARCH_RESULT_V2 {
    address: string;
    latitude: number;
    longitude: number;
    placeId: string;
    thumbnail: string;
    title: string;
    type: string;
}
