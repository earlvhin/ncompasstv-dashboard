import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DealerService } from 'src/app/global/services';

@Component({
    selector: 'app-delete-dealer-dialog',
    templateUrl: './delete-dealer-dialog.component.html',
    styleUrls: ['./delete-dealer-dialog.component.scss'],
})
export class DeleteDealerDialogComponent implements OnInit, OnDestroy {
    @Input() dealerId: string;
    @Input() businessName = '';
    @Input() userId: string;

    isDeleting = false;
    isDeleteSuccessful = false;
    retainContents = false;
    hasSubmittedRequest = false;
    protected _unsubscribe = new Subject<void>();

    constructor(private _dealer: DealerService) {}

    ngOnInit() {}

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onSubmit() {
        const dealerId = this.dealerId;
        const userId = this.userId;
        const retainContents = this.retainContents;
        this.isDeleting = true;

        this._dealer
            .delete_dealer({ dealerId, userId, retainContents })
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => (this.isDeleteSuccessful = true),
                (error) => {
                    this.isDeleteSuccessful = false;
                },
            )
            .add(() => {
                this.hasSubmittedRequest = true;
                this.isDeleting = false;
            });
    }
}
