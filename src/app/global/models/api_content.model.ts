import { CREDITS } from "./credits.model";
import { PlaylistContentSchedule } from "./playlist-content-schedule.model";

export class API_CONTENT {
    contentPlaysListCount?: API_CONTENT_PLAY_COUNT[];
    playlistContentId: string;
    contentId: string;
    createdBy: string;
    createdByName: string;
	creditsEnabled?: number | boolean;
	dealerId: string;
	duration: number;
    hostId: string;
    fileName: string;
    url: string;
    fileType: string;
    handlerId: string;
    dateCreated: string;
    uuid: string;
    isFullScreen: number;
    filesize: number;
    thumbnail: string;
    previewThumbnail: string;
    seq: number;
    contents: any;
    totalPlayed: number;
	updating: boolean;
	advertiserId: string;
	isActive: number;
    isConverted: number;
    title: string;
	playlistContentCredits?: CREDITS[];
	playlistContentSchedule?: PlaylistContentSchedule;
	playlistContentsSchedule?: PlaylistContentSchedule;
	scheduleStatus?: any;
	uploaded_by?: any;
	classification?: string;
	frequency: number;
}

export class API_CONTENT_PLAY_COUNT {
    dateTime: string;
    count: number;
}

export class API_CONTENT_HISTORY_LIST {
    contentHistoryLogs: API_CONTENT_HISTORY[];
    constructor(contents: API_CONTENT_HISTORY[]){
        this.contentHistoryLogs = contents;
    }
}

export class API_CONTENT_HISTORY {
    playlistContentId: string;
    contentId: string;
    playlistId: string;
    action: string;
    userId: string;
    constructor(playlistContentId: string, contentId: string, playlistId: string, action: string, userId: string){
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
    constructor(playlistContentId: string, contentId: string){
        this.playlistContentId = playlistContentId;
        this.contentId = contentId;
    }
}