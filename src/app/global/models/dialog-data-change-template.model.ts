import {
    API_PLAYLIST,
    API_SINGLE_PLAYLIST,
    API_TEMPLATE,
    UI_SCREEN_ZONE_PLAYLIST,
    UI_SINGLE_SCREEN,
} from '.';

export interface DIALOG_DATA_CHANGE_TEMPLATE {
    currentTemplate: API_TEMPLATE;
    dealerPlaylists?: API_PLAYLIST[];
    screenZonePlaylists: UI_SCREEN_ZONE_PLAYLIST[];
    playlistId: string;
    playlistRoute: string;
    screen: UI_SINGLE_SCREEN;
    templates: API_TEMPLATE[];
}
