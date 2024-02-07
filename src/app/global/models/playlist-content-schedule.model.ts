import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';

/**
 * SAMPLE DATA FROM API:
{
	dateCreated: "2021-04-07T03:38:49+00:00",
	days: "1,2,3,4,5,6,7",
	from: "2021-04-07T00:00:00",
	playTimeEnd: "11:59 PM",
	playTimeStart: "12:00 AM",
	playlistContentId: "1fe14dce-4bcc-4ef2-92a2-4b26f42a8ce1",
	playlistContentsScheduleId: "e53af2c9-0e55-48d1-ac0b-20d5d75f06cd",
	status: "A",
	to: "2026-04-07T00:00:00",
	type: 3
}
 */
export interface PlaylistContentSchedule {
    alternateWeek?: number;
    dateCreated?: string;
    days: string;
    from: string;
    playTimeEnd: string;
    playTimeStart: string;
    playlistContentId?: string;
    playlistContentsScheduleId?: string;
    status?: string;
    to: string;
    type: number;
    livestream?: number;
    playTimeStartData?: NgbTimeStruct;
    playTimeEndData?: NgbTimeStruct;
}
