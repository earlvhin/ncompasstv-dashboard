import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';

export interface UI_CONTENT_SCHEDULE {
    alternateWeek?: number;
    startDate?: string;
    endDate?: string;
    days?: { dayId: number; day: 'Sun|Mon|Tue|Wed|Thu|Fri|Sat'; checked: boolean }[];
    type?: number;
    playlistContentsScheduleId?: string;
    playTimeStartData?: NgbTimeStruct;
    playTimeEndData?: NgbTimeStruct;
}
