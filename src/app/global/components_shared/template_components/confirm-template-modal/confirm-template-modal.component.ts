import { Component, OnInit, Input, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TemplateService } from 'src/app/global/services';

@Component({
    selector: 'app-confirm-template-modal',
    templateUrl: './confirm-template-modal.component.html',
    styleUrls: ['./confirm-template-modal.component.scss'],
})
export class ConfirmTemplateModalComponent implements OnInit, OnDestroy {
    @Input() zone_data: any;
    data_saved: boolean = false;
    screen_width: number = 1920;
    screen_height: number = 1080;
    is_submitted: boolean = false;

    protected _unsubscribe: Subject<void> = new Subject<void>();
    constructor(
        @Inject(MAT_DIALOG_DATA) public z_data: any,
        private _template: TemplateService,
    ) {}

    ngOnInit() {
        this.zone_data = this.z_data;
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    saveTemplate() {
        this.is_submitted = true;

        this._template
            .new_template(this.zone_data.zones)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => {
                    this.data_saved = true;
                    this.is_submitted = false;
                },
                (error) => {
                    console.error(error);
                },
            );
    }
}
