import { API_SINGLE_PLAYLIST, API_TEMPLATE, UI_SCREEN_ZONE_PLAYLIST } from '.';

export interface DIALOG_DATA_CHANGE_TEMPLATE {
	currentTemplate: API_TEMPLATE;
	dealerPlaylists?: API_SINGLE_PLAYLIST[];
	screenZonePlaylists: UI_SCREEN_ZONE_PLAYLIST[];
	playlistId: string;
	playlistRoute: string;
	templates: API_TEMPLATE[];
}
