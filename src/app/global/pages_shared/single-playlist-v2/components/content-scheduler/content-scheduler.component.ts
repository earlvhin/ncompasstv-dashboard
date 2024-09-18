import { Component, ChangeDetectorRef, OnInit, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_CONTENT_V2 } from 'src/app/global/models';
import { CONTENT_SCHEDULE } from '../../constants/ContentSchedule';
import { SinglePlaylistService } from '../../services/single-playlist.service';
import { ButtonGroup } from '../../type/ButtonGroup';

@Component({
    selector: 'app-content-scheduler',
    templateUrl: './content-scheduler.component.html',
    styleUrls: ['./content-scheduler.component.scss'],
})
export class ContentSchedulerComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() contents?: API_CONTENT_V2[] = [];
    @Input() hasExistingSchedule = false;
    @Input() page = '';
    @Input() scheduleType: 1 | 2 | 3 = 1; // 1 - Default, 2 - Do Not Play, 3 - Custom Scheduled

    scheduleTypes = CONTENT_SCHEDULE;
    selectedContentSchedule: ButtonGroup = this.scheduleTypes[0];
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _playlist: SinglePlaylistService,
    ) {}

    ngOnInit() {
        this.subscribeToSchedulerFormData();
        this.initializeData();
    }

    ngAfterViewInit(): void {
        this._changeDetectorRef.detectChanges();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onSelectContentScheduleType(data: ButtonGroup) {
        this.selectedContentSchedule = data;

        this._playlist.scheduleTypeSelected.emit({
            type: data.value as 1 | 2 | 3,
            hasExistingSchedule: this.hasExistingSchedule,
        });

        setTimeout(() => {
            const formValidity = { isInvalid: false, errors: null };

            if (data.value === 3) return;

            this._playlist.contentSchedulerFormValidity.emit(formValidity);
        }, 0);

        // if custom schedule type is selected then request form data first
        if (data.value === 3 && this.page === 'add-content') {
            this._playlist.requestSchedulerFormData.emit();
            return;
        }
    }

    private initializeData() {
        const selectedButtonGroup = this.scheduleTypes.filter((type) => type.value === this.scheduleType)[0];
        this.selectedContentSchedule = selectedButtonGroup;

        if (this.hasExistingSchedule) {
            const { playTimeStart, playTimeEnd, from, to, alternateWeek, days } = this.contents[0];

            // intentional delay because it takes a while to load the existing data
            setTimeout(() => {
                this._playlist.receiveExistingScheduleData.emit({
                    playTimeStart,
                    playTimeEnd,
                    from,
                    to,
                    alternateWeek,
                    days,
                    type: 3,
                });
            }, 0);

            return;
        }

        // Setting "Default Play" as initial button schedule active
        this._playlist.scheduleTypeSelected.emit({
            type: 1,
            hasExistingSchedule: this.hasExistingSchedule,
        });
    }

    private subscribeToSchedulerFormData() {
        this._playlist.receiveSchedulerFormData.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
            this._playlist.schedulerFormUpdated.emit({ type: 3, ...response });
        });
    }
}
