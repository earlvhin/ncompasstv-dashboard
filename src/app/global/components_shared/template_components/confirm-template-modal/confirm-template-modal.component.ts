import { Component, OnInit, Input, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

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

    protected ngUnsubscribe = new Subject<void>();
    constructor(
        @Inject(MAT_DIALOG_DATA) public z_data: any,
        private _template: TemplateService,
    ) {}

    ngOnInit() {
        this.zone_data = this.z_data;
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    saveTemplate() {
        this.is_submitted = true;

        this._template
            .new_template(this.zone_data.zones)
            .pipe(
                takeUntil(this.ngUnsubscribe),
                finalize(() => (this.is_submitted = false)),
            )
            .subscribe(
                () => (this.data_saved = true),
                (e) => {
                    console.error(e);
                },
            );
    }
}
