import { API_ROLE_INFO } from './ui_role_info.model';
export class UI_CURRENT_USER {
    firstname: string;
    jwt: { token: string; refreshToken: string };
    lastname: string;
    roleInfo: API_ROLE_INFO;
    role_id: string;
    user_id: string;
}
