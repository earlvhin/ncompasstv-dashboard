import { API_CONTENT } from "./api_content.model";

export interface PlaylistContentScheduleDialog {
	mode: string;
	content_ids?: string[];
	schedules?: { id: string, content_id: string}[];
	content?: API_CONTENT;

}
