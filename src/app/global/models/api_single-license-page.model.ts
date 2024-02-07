import {
    API_DEALER,
    API_HOST,
    API_LICENSE_PROPS,
    API_SCREEN,
    API_SCREENTYPE,
    API_TIMEZONE,
} from '.';

export interface API_SINGLE_LICENSE_PAGE {
    dealer: API_DEALER;
    host: API_HOST;
    license: API_LICENSE_PROPS;
    screen: API_SCREEN;
    screenType: API_SCREENTYPE;
    timezone: API_TIMEZONE;
    totalContents: number;
}
