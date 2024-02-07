import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';

import { API_CONTENT } from 'src/app/global/models/api_content.model';

@Component({
    selector: 'app-content-schedule-card',
    templateUrl: './content-schedule-card.component.html',
    styleUrls: ['./content-schedule-card.component.scss'],
})
export class ContentScheduleCardComponent implements OnInit {
    @Input() content: API_CONTENT;
    @Input() index: number;

    has_schedule = false;
    schedule = { date: '', days: '', time: '' };

    constructor() {}

    ngOnInit() {
        this.setSchedule();
    }

    private setCustomSchedule(): void {
        const content = this.content;
        if (!content.playlistContentsSchedule) return;

        let { from, to, days, playTimeStart, playTimeEnd } = content.playlistContentsSchedule;
        this.schedule.date = `${moment(from).format('MMM DD, YYYY')} - ${moment(to).format('MMM DD, YYYY')}`;
        this.schedule.days = this.setDays(days);
        this.schedule.time =
            playTimeStart == '12:00 AM' && playTimeEnd == '11:59 PM'
                ? 'All Day'
                : `${playTimeStart} - ${playTimeEnd}`;
        this.has_schedule = true;
    }

    private setDays(data: string): string {
        if (data === '0,1,2,3,4,5,6') return 'Everyday';

        const result = [];

        const daysArr = data.split(',');

        daysArr.forEach((numeric) => {
            switch (numeric) {
                case '0':
                    result.push('Sun');
                    break;
                case '1':
                    result.push('Mon');
                    break;
                case '2':
                    result.push('Tue');
                    break;
                case '3':
                    result.push('Wed');
                    break;
                case '4':
                    result.push('Thu');
                    break;
                case '5':
                    result.push('Fri');
                    break;
                case '6':
                    result.push('Sat');
                    break;
                default:
            }
        });

        return result.join(', ');
    }

    private setDefaultSchedule(): void {
        this.schedule = { date: 'Default', days: 'Default', time: 'Default' };
    }

    private setSchedule(): void {
        if (!this.content.playlistContentsSchedule) return;

        const { type } = this.content.playlistContentsSchedule;

        switch (type) {
            case 2:
                this.setToNotPlaySchedule();
                break;
            case 3:
                this.setCustomSchedule();
                break;
            default:
                this.setDefaultSchedule();
        }
    }

    private setToNotPlaySchedule(): void {
        this.schedule = { date: 'Do not play', days: 'Do not play', time: 'Do not play' };
    }
}
