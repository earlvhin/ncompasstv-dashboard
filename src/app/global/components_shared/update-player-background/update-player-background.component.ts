import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import * as filestack from 'filestack-js';
import * as io from 'socket.io-client';

import { environment } from 'src/environments/environment';
import { ConfirmationModalComponent } from '../page_components/confirmation-modal/confirmation-modal.component';
import { LicenseService } from '../../services';
import { SOCKET_EVENTS } from '../../constants/socket-events';
import { API_PLAYER_BACKGROUND } from '../../models';

@Component({
    selector: 'app-update-player-background',
    templateUrl: './update-player-background.component.html',
    styleUrls: ['./update-player-background.component.scss'],
})
export class UpdatePlayerBackgroundComponent implements OnInit, OnDestroy {
    background: string;
    changeBackgroundHover = false;
    imageConverting = false;
    popUpMessage = false;
    triggeredSocket = SOCKET_EVENTS;

    @Input() license_data: API_PLAYER_BACKGROUND;
    @Input() pi_status: boolean;
    @Output() refresh_background = new EventEmitter();

    protected _socket: any;

    constructor(
        private _dialog: MatDialog,
        private _license: LicenseService,
    ) {}

    ngOnInit() {
        this.initializeSocketServer();
        this.initializeSocketEventWatchers();
    }

    ngOnDestroy() {
        this._socket.disconnect();
    }

    private initializeSocketServer() {
        this._socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__UpdatePlayerBackgroundComponent',
        });
    }

    private initializeSocketEventWatchers(): void {
        this.socketOnSuccessfulChangeBackground();
        this.socketOnFailedChangeBackground();
    }

    public onChangeBackground() {
        const client = filestack.init(environment.third_party.filestack_api_key);
        client.picker(this.filestackOptions).open();
    }

    public successMessage() {
        this.openConfirmationModal('success', 'Success!', 'Player background successfully updated.');
    }

    public errorMessage() {
        this.openConfirmationModal('error', 'Error! Invalid Link', 'Player background not Updated.');
    }

    protected get filestackOptions(): filestack.PickerOptions {
        let folder = 'dev';
        if (environment.production) folder = 'prod';
        else if (environment.base_uri.includes('stg')) folder = 'stg';
        return {
            storeTo: {
                location: 's3',
                container: `n-compass-files/license-player/${folder}/${this.license_data.licenseId}/`,
                region: 'us-east-1',
            },
            accept: ['image/jpg', 'image/jpeg', 'image/png'],
            maxFiles: 1,
            onUploadDone: (response) => {
                const awsKey = environment.s3_ncompass_files;
                const imageKey = response.filesUploaded[0].key;
                this.background = `${awsKey}${imageKey}`;

                this._license
                    .update_player_background({
                        licenseId: this.license_data.licenseId,
                        backgroundImageUrl: this.background,
                    })
                    .subscribe(() => {
                        this.socketEmitChangeBackground();
                        this.imageConverting = true;

                        if (this.pi_status === false) {
                            this.imageConverting = true;
                            this.successMessage();
                            this.popUpMessage = true;
                        }
                    });
            },
        };
    }

    private socketEmitChangeBackground(): void {
        this._socket.emit(this.triggeredSocket.changeBackground, {
            url: this.background,
            license_id: this.license_data.licenseId,
        });
    }

    private openConfirmationModal(status: string, message: string, data: string) {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: { status, message, data },
            })
            .afterClosed()
            .subscribe(() => {
                this._dialog.closeAll();
                this.refresh_background.emit(true);

                setTimeout(() => {
                    this.imageConverting = false;
                }, 2000);

                //For the alert to stay for 5 seconds
                setTimeout(() => {
                    this.popUpMessage = false;
                }, 5000);
            });
    }

    private socketOnSuccessfulChangeBackground(): void {
        this._socket.on(this.triggeredSocket.changeBackgroundSuccess, (license: { license_id: string }) => {
            if (this.license_data.licenseId !== license.license_id) return;
            this.successMessage();
        });
    }

    private socketOnFailedChangeBackground(): void {
        this._socket.on(this.triggeredSocket.changeBackgroundFailed, (license: { license_id: string }) => {
            if (this.license_data.licenseId !== license.license_id) return;
            this.errorMessage();
        });
    }
}
