import { API_CONTENT, CREDITS, CREDITS_STATUS, CREDITS_TO_SUBMIT } from '.';

export interface PLAYLIST_CHANGES {
    content: API_CONTENT;
    blocklist?: any;
    credits?: CREDITS[];
    credits_status?: CREDITS_STATUS;
    credits_to_submit?: CREDITS_TO_SUBMIT;
}
