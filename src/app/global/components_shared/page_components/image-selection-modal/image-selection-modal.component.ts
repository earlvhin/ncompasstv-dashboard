import { Component, Input, OnDestroy, OnInit, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { HostService, DealerService } from 'src/app/global/services';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-image-selection-modal',
    templateUrl: './image-selection-modal.component.html',
    styleUrls: ['./image-selection-modal.component.scss'],
})
export class ImageSelectionModalComponent implements OnInit, OnDestroy {
    @Input() placeId: string;

    hasNoData = false;
    images: string[];
    noDataMessage = 'No photos found';
    selectedImageIndex: number;
    selectedImageUrl: string;

    dealerId: string;
    fromDealer: boolean = false;
    imagesArray: any = [];

    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public _dialog_data: any,
        private _host: HostService,
        private _dealer: DealerService,
        public dialogRef: MatDialogRef<ImageSelectionModalComponent>,
    ) {}

    ngOnInit() {
        if (this._dialog_data) {
            this.fromDealer = this._dialog_data.fromDealer;
            this.imagesArray = this._dialog_data.imagesArray;
            this.dealerId = this._dialog_data.dealerId;

            this.images = this.imagesArray;
            if (this.imagesArray.length == 0) this.hasNoData = true;
        } else this.getHostPlaceImages();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onSelectImage(index: number, url: string) {
        if (index === this.selectedImageIndex) {
            this.selectedImageIndex = null;
            return;
        }

        this.selectedImageIndex = index;
        this.selectedImageUrl = url;
    }

    returnSelectedImageData() {
        if (this.fromDealer) {
            let dealer_info = {
                dealerid: this.dealerId,
                logo: this.selectedImageUrl,
            };

            this._dealer.update_dealer_logo(dealer_info).subscribe(() => {
                this.dialogRef.close('success');
            });
        } else this.dialogRef.close({ images: this.images, logo: this.selectedImageUrl });
    }

    private getHostPlaceImages(): void {
        this._host
            .get_host_place_images(this.placeId)
            .pipe(
                takeUntil(this._unsubscribe),
                map((response) => response.images),
            )
            .subscribe(
                (response) => {
                    if (!response) {
                        this.hasNoData = true;
                        return;
                    }

                    this.images = response;
                },
                (error) => {
                    this.hasNoData = true;
                },
            );
    }
}
