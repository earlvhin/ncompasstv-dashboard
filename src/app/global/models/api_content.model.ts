import { CREDITS } from './credits.model';
import { PlaylistContentSchedule } from './playlist-content-schedule.model';

export class API_CONTENT {
    advertiserId: string;
    classification?: string;
    contentId: string;
    contentPlaysListCount?: API_CONTENT_PLAY_COUNT[];
    contents?: any;
    createdBy: string;
    createdByName: string;
    creditsEnabled?: number | boolean;
    dateCreated: string;
    dealerId: string;
    description: string;
    duration?: number;
    durationsTotal: number;
    feedId: string;
    fileName?: string;
    fileType: string;
    filesize?: number;
    frequency?: number;
    handlerId?: string;
    hostId?: string;
    isActive: number;
    isConverted: number;
    isFullScreen: number;
    isProtected: number;
    ownerType?: string;
    ownerRoleId?: string;
    parentId?: string;
    playlistContentCredits?: CREDITS[];
    playlistContentId: string;
    playlistContentSchedule?: PlaylistContentSchedule; // used by pi_download & get_content_by_license_id
    playlistContentsSchedule?: PlaylistContentSchedule; // used by playlist and screen
    playsTotal: number;
    prefix?: string;
    previewThumbnail?: string;
    refDealerId?: string;
    scheduleStatus?: string;
    seq: number;
    thumbnail: string;
    title: string;
    totalPlayed: number;
    uploaded_by?: string;
    url: string;
    uuid?: string;
}

export class API_CONTENT_PLAY_COUNT {
    dateTime: string;
    count: number;
}

export class API_CONTENT_HISTORY_LIST {
    contentHistoryLogs: API_CONTENT_HISTORY[];
    constructor(contents: API_CONTENT_HISTORY[]) {
        this.contentHistoryLogs = contents;
    }
}

export class API_CONTENT_HISTORY {
    playlistContentId: string;
    contentId: string;
    playlistId: string;
    action: string;
    userId: string;
    constructor(
        playlistContentId: string,
        contentId: string,
        playlistId: string,
        action: string,
        userId: string,
    ) {
        this.playlistContentId = playlistContentId;
        this.contentId = contentId;
        this.playlistId = playlistId;
        this.action = action;
        this.userId = userId;
    }
}

export class API_CONTENT_DATA {
    playlistContentId: string;
    contentId: string;
    constructor(playlistContentId: string, contentId: string) {
        this.playlistContentId = playlistContentId;
        this.contentId = contentId;
    }
}
