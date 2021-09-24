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
