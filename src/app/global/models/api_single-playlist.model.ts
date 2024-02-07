import { API_CONTENT } from './api_content.model';
import { API_HOST } from './api_host.model';
import { API_LICENSE_PROPS } from './api_license.model';

export class API_SINGLE_PLAYLIST {
    blacklistedIContents: API_CONTENT_BLACKLISTED_CONTENTS[];
    playlist: API_SINGLE_PLAYLIST_INFO;
    hosts: API_HOST[];
    licenses: API_LICENSE_PROPS[];
    hostLicenses: any;
    playlistContents: API_CONTENT[];
    screens: API_SCREEN_OF_PLAYLIST[];
    playlistId?: any;
    contents?: any;
}

export class API_SINGLE_PLAYLIST_INFO {
    playlistId: string;
    dealerId: string;
    playlistName: string;
    playlistDescription: string;
    playlistType: string;
    businessName: string;
    dateCreated: string;
}

export class API_CONTENT_BLACKLISTED_CONTENTS {
    blacklistedContents: BLACKLISTED_CONTENT[];
    content: API_CONTENT;
}

export class BLACKLISTED_CONTENT {
    blacklistedContentId: string;
    contentId: string;
    dateCreated: string;
    dateUpdated: string;
    licenseId: string;
}

export class API_SCREEN_OF_PLAYLIST {
    createdBy: string;
    dateCreated: string;
    dateUpdated: string;
    dealerId: string;
    description: string;
    hostId: string;
    screenId: string;
    screenName: string;
    templateId: string;
}
