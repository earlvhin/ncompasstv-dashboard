import { API_CONTENT } from './api_content.model';
import { API_LICENSE } from './api_license.model';

export class API_SINGLE_SCREEN {
    createdBy: createdBy;
    dealer: dealer;
    host: host;
    licenses: API_LICENSE['license'][];
	notes?: string;
    screen: screenInfo;
    screenTypeId?: string;
    screenZonePlaylistsContents: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[] = [];
    template: template;
}

class screenInfo {
    screenId: string;
    screenName: string;
    description: string;
    dealerId: string;
    hostId: string;
    templateId: string;
    createdBy: string;
    dateCreated: string;
	dateUpdated: string;
	screenTypeId: string;
}

export class API_SCREEN_ZONE_PLAYLISTS_CONTENTS {
    screenTemplateZonePlaylist: API_SCREEN_TEMPLATE_ZONE;
    contents: API_CONTENT[];
}

export class API_SCREEN_TEMPLATE_ZONE {
    screenId: string;
    templateId: string;
    xPos: string;
    yPos: string;
    height: string;
    width: string;
    playlistId: string;
    playlistName: string;
    playlistType: string;
    name: string;
    description: string;
	templateZoneId: string;
	order: number;
}

class dealer {
    dealerId: string;
    businessName: string;
}

class host{
    hostId: string;
    dealerId: string;
    dealer: string;
    businessName: string;
    name: string;
    notes?: string;
}

class template {
    templateId: string;
    name: string;
}

class createdBy {
    userId: string;
    firstName: string;
    lastName: string;
}