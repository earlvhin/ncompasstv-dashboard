import { API_LICENSE } from './api_license.model';
import { API_SCREEN } from './api_screen.model';
import { API_SCREEN_ZONE_PLAYLISTS_CONTENTS } from './api_single-screen.model';

export interface API_GET_SCREEN {
    createdBy: { userId: string; firstName: string; lastName: string };
    dealer: { dealerId: string; businessName: string };
    host: {
        hostId: string;
        dealerId: string;
        dealer: string;
        businessName: string;
        name: string;
        notes?: string;
    };
    licenses: API_LICENSE['license'][];
    notes?: string;
    screen: API_SCREEN;
    screenTypeId?: string;
    screenZonePlaylistsContents: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[];
    template: { templateId: string; name: string };
}
