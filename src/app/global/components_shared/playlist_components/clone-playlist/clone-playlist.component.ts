import { Component, OnInit, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { API_CREATE_PLAYLIST_CONTENT } from '../../../../global/models/api_create-playlist.model';
import { API_SINGLE_PLAYLIST } from 'src/app/global/models/api_single-playlist.model';
import { UI_SINGLE_PLAYLIST } from '../../../../global/models/ui_single-playlist.model';
import { PlaylistService } from '../../../services/playlist-service/playlist.service';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Component({
    selector: 'app-clone-playlist',
    templateUrl: './clone-playlist.component.html',
    styleUrls: ['./clone-playlist.component.scss'],
})
export class ClonePlaylistComponent implements OnInit {
    @Input() playlistVersion: 1 | 2 = 1;
    clone_playlist_form: FormGroup;
    clone_success: boolean = false;
    cloned_playlist: any;
    cloned_playlist_content: API_CREATE_PLAYLIST_CONTENT[];
    form_submitted: boolean = false;
    form_valid: boolean = true;
    playlist: UI_SINGLE_PLAYLIST;
    subscription: Subscription = new Subscription();
    form_fields_view = [
        {
            label: 'Playlist New Title',
            control: 'playlist_title',
            placeholder: 'Ex: Department Store Playlist',
            type: 'text',
        },
        {
            label: 'Playlist New Description',
            control: 'playlist_description',
            placeholder: 'Ex: This playlist is for the Department Store',
            type: 'text',
        },
    ];

    constructor(
        private _form: FormBuilder,
        private _playlist: PlaylistService,
        private _router: Router,
        private _auth: AuthService,
        @Inject(MAT_DIALOG_DATA) public playlist_data: API_SINGLE_PLAYLIST,
    ) {}

    ngOnInit() {
        this.clone_playlist_form = this._form.group({
            playlist_title: ['', Validators.required],
            playlist_description: ['', Validators.required],
        });

        this.subscription.add(
            this.clone_playlist_form.valueChanges.subscribe(() => {
                if (this.clone_playlist_form.valid) {
                    this.form_valid = false;
                } else {
                    this.form_valid = true;
                }
            }),
        );
    }

    get f() {
        return this.clone_playlist_form.controls;
    }

    clonePlaylist() {
        this.form_submitted = true;

        this.cloned_playlist = {
            playlistId: this.playlist_data.playlist.playlistId,
            playlistName: this.f.playlist_title.value,
            playlistDescription: this.f.playlist_description.value,
        };

        this.subscription.add(
            this._playlist.clone_playlist(this.cloned_playlist).subscribe(
                (data) => {
                    this.form_submitted = false;
                    this.clone_success = true;
                    this.redirectToClonedPlaylist(data.playlistId);
                },
                (error) => {
                    throw new Error();
                },
            ),
        );
    }

    redirectToClonedPlaylist(id: string) {
        let route = `/${this.roleRoute}/playlists`;
        if (this.playlistVersion === 2) route += `/v2/${id}`;
        else route += `/${id}`;
        this._router.navigate([route]);
    }

    protected get roleRoute() {
        let role = this._auth.roleRoute;
        // Manual override role definition if user is dealeradmin
        if (role === 'dealeradmin') role = 'administrator';
        return role;
    }
}
