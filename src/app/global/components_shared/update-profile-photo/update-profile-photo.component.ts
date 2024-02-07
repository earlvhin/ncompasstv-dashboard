import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as filestack from 'filestack-js';
import { environment } from 'src/environments/environment';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { ConfirmationModalComponent } from '../page_components/confirmation-modal/confirmation-modal.component';
import { DealerService } from '../../services';
import { ImageSelectionModalComponent } from '../page_components/image-selection-modal/image-selection-modal.component';

@Component({
    selector: 'app-update-profile-photo',
    templateUrl: './update-profile-photo.component.html',
    styleUrls: ['./update-profile-photo.component.scss'],
})
export class UpdateProfilePhotoComponent implements OnInit {
    @Input() creation: boolean = false;
    @Input() dealer: boolean;
    @Input() page_data: any;
    @Output() refresh_image = new EventEmitter();

    edit_dealer_logo: boolean = false;
    show_options: boolean = false;

    constructor(
        private _dialog: MatDialog,
        private _dealer: DealerService,
    ) {}

    ngOnInit() {
        if (this.creation) this.page_data = [];
    }

    closeProfileOptions() {
        this.edit_dealer_logo = false;
        this.show_options = false;
    }

    private openConfirmationModal(status: string, message: string, data: string) {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: { status, message, data },
            })
            .afterClosed()
            .subscribe((response) => {
                this.closeProfileOptions();
                this._dialog.closeAll();
                this.refresh_image.emit(true);
            });
    }

    uploadDealerPhoto() {
        const client = filestack.init(environment.third_party.filestack_api_key);
        client.picker(this.filestackOptions).open();
    }

    protected get filestackOptions(): filestack.PickerOptions {
        let folder = 'dev';
        if (environment.production) folder = 'prod';
        else if (environment.base_uri.includes('stg')) folder = 'stg';
        return {
            storeTo: {
                location: 's3',
                container:
                    'nctv-images-' + folder + '/logo/dealers/' + this.page_data.dealerId + '/',
                region: 'us-east-1',
            },
            accept: ['image/jpg', 'image/jpeg', 'image/png'],
            maxFiles: 1,
            imageMax: [720, 640],
            onUploadDone: (response) => {
                let sliced_imagekey = response.filesUploaded[0].key.split('/');
                sliced_imagekey = sliced_imagekey[sliced_imagekey.length - 1].split('_');
                let logo = sliced_imagekey[0] + '_' + response.filesUploaded[0].filename;

                let dealer_info = {
                    dealerid: this.page_data.dealerId,
                    logo: logo,
                };
                this._dealer.update_dealer_logo(dealer_info).subscribe(() => {
                    this.successMessage();
                });
            },
        };
    }

    updateProfilePhoto(logo) {
        let dealer_info = {
            dealerid: this.page_data.dealerId,
            logo: logo,
        };
        this._dealer.update_dealer_logo(dealer_info).subscribe(() => {
            this.successMessage();
        });
    }

    successMessage() {
        this.openConfirmationModal('success', 'Success!', 'Profile picture successfully updated.');
    }

    getDealerExistingPhotos() {
        this._dealer.get_dealer_logo(this.page_data.dealerId).subscribe((response) => {
            if (!response.message) {
                let imagesArray = response.files;

                this._dialog
                    .open(ImageSelectionModalComponent, {
                        width: '700px',
                        disableClose: true,
                        data: { fromDealer: true, imagesArray, dealerId: this.page_data.dealerId },
                    })
                    .afterClosed()
                    .subscribe((response) => {
                        if (!response) return;
                        if (response == 'success')
                            this.openConfirmationModal(
                                'success',
                                'Success!',
                                'Profile picture successfully updated.',
                            );
                    });
            }
        });
    }
}
