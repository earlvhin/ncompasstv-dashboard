import { API_CONTENT } from "./api_content.model";
import { CREDITS_STATUS } from "./credits-status.model";
import { CREDITS } from "./credits.model";

export interface PLAYLIST_CHANGES {
	content: API_CONTENT;
	blocklist?: any;
	original_credits?: CREDITS;
	credits_status?: CREDITS_STATUS;
}
