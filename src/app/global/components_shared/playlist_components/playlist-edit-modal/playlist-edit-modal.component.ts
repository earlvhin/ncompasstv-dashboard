import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material';
import { PlaylistService } from '../../../services/playlist-service/playlist.service';
import { UI_SINGLE_PLAYLIST } from '../../../../global/models/ui_single-playlist.model';
import { API_SINGLE_PLAYLIST } from 'src/app/global/models/api_single-playlist.model';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-playlist-edit-modal',
    templateUrl: './playlist-edit-modal.component.html',
    styleUrls: ['./playlist-edit-modal.component.scss'],
})
export class PlaylistEditModalComponent implements OnInit {
    subscription: Subscription = new Subscription();
    edit_form: FormGroup;
    disable_btn: boolean = true;
    is_submitted: boolean = false;
    is_saved: boolean = false;
    isLoading: boolean = false;
    errorMessage = '';

    constructor(
        private _playlist: PlaylistService,
        private _form: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public _playlist_data: API_SINGLE_PLAYLIST,
        private dialogRef: MatDialogRef<PlaylistEditModalComponent>,
    ) {}

    ngOnInit() {
        this.edit_form = this._form.group({
            playlistId: [this._playlist_data.playlist.playlistId, Validators.required],
            dealerId: [this._playlist_data.playlist.dealerId, Validators.required],
            playlistName: [this._playlist_data.playlist.playlistName, [Validators.required, Validators.maxLength(50)]],
            playlistDescription: [
                this._playlist_data.playlist.playlistDescription,
                [Validators.required, Validators.maxLength(100)],
            ],
        });

        this.subscription.add(
            this.edit_form.valueChanges.subscribe((data: any) => {
                if (this.edit_form.valid) {
                    this.disable_btn = false;
                } else {
                    this.disable_btn = true;
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    // Convenience getter for easy access to form fields
    get f() {
        return this.edit_form.controls;
    }

    updatePlaylistInfo() {
        this.is_submitted = true;

        // Stop here if form is invalid
        if (this.edit_form.invalid) {
            return;
        }

        this.isLoading = true;

        // Create a copy of the form's value
        const formValue = this.edit_form.value;

        this.edit_form.controls['playlistName'].disable();
        this.edit_form.controls['playlistDescription'].disable();

        // Use the copied form value when calling update_playlist_info
        this._playlist.update_playlist_info(formValue).subscribe(
            (data) => {
                this.is_saved = true;
                this.closeModalAfterDelay();
            },
            (error) => {
                this.is_submitted = false;
                this.isLoading = false;

                // Set the error message
                if (error.status === 0) {
                    // Network error
                    this.errorMessage = 'Network connection problem. Please check your network and try again.';
                } else {
                    // Other error
                    this.errorMessage = error.message;
                }

                this.edit_form.controls['playlistName'].enable();
                this.edit_form.controls['playlistDescription'].enable();
            },
        );
    }

    closeModalAfterDelay() {
        setTimeout(() => {
            this.dialogRef.close();
        }, 1500); // Close the modal after 1.5 seconds (1500 milliseconds)
    }
}
