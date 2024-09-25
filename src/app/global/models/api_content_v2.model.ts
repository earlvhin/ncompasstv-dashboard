import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { PlaylistContentSchedule } from './playlist-content-schedule.model';
import { ViewFillersGroupComponent } from '../pages_shared/fillers/components/view-fillers-group/view-fillers-group.component';

export interface API_CONTENT_V2 {
    advertiserId?: any;
    createdByName?: string;
    contentId: any;
    dateCreated: any;
    dealerId: any;
    description: any;
    feedId?: any;
    fileName?: any;
    fileType?: any;
    isConverted?: any;
    isFullScreen?: any;
    isProtected?: any;
    playsTotal?: any;
    seq?: any;
    thumbnail?: any;
    title?: any;
    url?: any;
    alternateWeek?: number;
    classification?: string;
    creditsEnabled?: number | boolean;
    days?: string;
    duration?: any;
    filesize?: string | number;
    frequency?: number;
    from?: string;
    handlerId?: string;
    hostId?: string;
    liveStream?: number;
    parentId?: string;
    playTimeEnd?: null;
    playTimeEndData?: NgbTimeStruct;
    playTimeStart?: null;
    playTimeStartData?: NgbTimeStruct;
    playlistContentId?: string;
    playlistContentsScheduleId?: string;
    prefix?: string;
    previewThumbnail?: string;
    refDealerId?: string;
    schedule?: PlaylistContentSchedule;
    scheduleStatus?: string;
    status?: string;
    to?: string;
    type?: number;
    uuid?: string;
    createdBy?: string; //Filler
    dateUpdated?: any; //Filler
    fillerGroups?: any; // Filler for now any, need to pull to certain branch for type
    fillerPlaylistContentId?: string; //Filler
    fillerPlaylistId?: string; //Filler
    groupCount?: number; //Filler
    interval?: string; //Filler
    name?: string; //Filler
    playlists?: string; //Filler
    role?: number; //Filler
    totalFillers?: number; //Filler
    updatedBy: string; //Filler
    updatedByName: string; //Filler
}
