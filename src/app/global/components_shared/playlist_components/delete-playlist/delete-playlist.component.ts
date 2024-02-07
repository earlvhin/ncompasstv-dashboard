import { Component, OnInit, Input, Inject, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { PlaylistService } from '../../../../global/services/playlist-service/playlist.service';
import { Router } from '@angular/router';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-delete-playlist',
    templateUrl: './delete-playlist.component.html',
    styleUrls: ['./delete-playlist.component.scss'],
})
export class DeletePlaylistComponent implements OnInit {
    data: any;
    is_dealer: any;
    screens: any;
    subscription: Subscription = new Subscription();

    @Output() update_info = new EventEmitter();

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
        private _auth: AuthService,
        private _dialog: MatDialog,
        public dialogRef: MatDialogRef<DeletePlaylistComponent>,
        public _playlist: PlaylistService,
        private _router: Router,
    ) {}

    ngOnInit() {
        this.screens = this._dialog_data.screens;
        if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
            this.is_dealer = true;
        }
    }

    forceDelete() {
        this.dialogRef.close();
        this.subscription.add(
            this._playlist.remove_playlist(this._dialog_data.playlist_id, 1).subscribe(
                (data) => {
                    this.update_info.emit(true);
                    this._dialog.open(ConfirmationModalComponent, {
                        width: '500px',
                        height: '350px',
                        data: {
                            status: 'success',
                            message: 'Playlist Successfully Deleted',
                            data: 'Press OK to continue.',
                        },
                    });
                },
                (error) => {
                    console.error(error);
                },
            ),
        );
    }
}
