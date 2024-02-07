import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { LicenseService } from 'src/app/global/services';

@Component({
    selector: 'app-update-tv-brand-dialog',
    templateUrl: './update-tv-brand-dialog.component.html',
    styleUrls: ['./update-tv-brand-dialog.component.scss'],
})
export class UpdateTvBrandDialogComponent implements OnInit, OnDestroy {
    @Input() licenseId: string;
    @Input() tvBrand: string;
    isSaving = false;
    hasSubmitted = false;

    protected _unsubscribe = new Subject<void>();
    constructor(
        private _license: LicenseService,
        private _dialogRef: MatDialogRef<UpdateTvBrandDialogComponent>,
    ) {}

    ngOnInit() {}

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    updateTvBrand() {
        this.isSaving = true;
        this._license
            .update_tv_brand(this.licenseId, this.tvBrand)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => {
                    this.isSaving = false;
                    this.hasSubmitted = true;

                    setTimeout(() => {
                        this._dialogRef.close(this.tvBrand);
                    }, 2500);
                },
                (e) => {
                    throw new Error(e);
                },
            );
    }
}
