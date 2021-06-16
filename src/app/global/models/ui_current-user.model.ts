import { API_ROLE_INFO } from './ui_role_info.model';
export class UI_CURRENT_USER {
    user_id: string;
    firstname: string;
    lastname: string;
    role_id: string;
    roleInfo: API_ROLE_INFO;
    jwt: { token: string, refreshToken: string; };
}
