import { API_LICENSE } from './api_license.model';

export class GET_LICENSE_BY_INSTALL_DATE {
    licenses: {
        host: object;
        license: API_LICENSE;
        screen: object;
        screenType: object;
    }[];

    next_month: number;
    this_month: number;
    previous_month: number;
}
