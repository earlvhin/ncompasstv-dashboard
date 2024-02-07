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
    background?: string;
    description?: string;
    height: string;
    name: string;
    order: number;
    playlistDescription?: string;
    playlistId: string;
    playlistName: string;
    screenId: string;
    templateId: string;
    templateZoneId: string;
    width: string;
    xPos: string;
    yPos: string;
    playlistType?: string;
}

class dealer {
    dealerId: string;
    businessName: string;
}

class host {
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
