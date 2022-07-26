import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PlaylistService } from '../../../services/playlist-service/playlist.service';
import { UI_SINGLE_PLAYLIST } from '../../../../global/models/ui_single-playlist.model';
import { API_CREATE_PLAYLIST, API_CREATE_PLAYLIST_CONTENT } from '../../../../global/models/api_create-playlist.model';
import { UI_CONTENT, UI_PLAYLIST_CONTENT } from '../../../../global/models/ui_content.model';
import { API_SINGLE_PLAYLIST } from 'src/app/global/models/api_single-playlist.model';
import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { RoleService } from 'src/app/global/services/role-service/role.service';

@Component({
	selector: 'app-clone-playlist',
	templateUrl: './clone-playlist.component.html',
	styleUrls: ['./clone-playlist.component.scss']
})
export class ClonePlaylistComponent implements OnInit {
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
			type: 'text'
		},
		{
			label: 'Playlist New Description',
			control: 'playlist_description',
			placeholder: 'Ex: This playlist is for the Department Store',
			type: 'text'
		}
	];

	constructor(
		private _form: FormBuilder,
		private _playlist: PlaylistService,
		private _router: Router,
		private _role: RoleService,
		@Inject(MAT_DIALOG_DATA) public playlist_data: API_SINGLE_PLAYLIST
	) {}

	ngOnInit() {
		this.clone_playlist_form = this._form.group({
			playlist_title: ['', Validators.required],
			playlist_description: ['', Validators.required]
		});

		this.subscription.add(
			this.clone_playlist_form.valueChanges.subscribe((data) => {
				if (this.clone_playlist_form.valid) {
					this.form_valid = false;
				} else {
					this.form_valid = true;
				}
			})
		);
	}

	get f() {
		return this.clone_playlist_form.controls;
	}

	clonePlaylist() {
		let counter = 0;
		this.form_submitted = true;

		// this.cloned_playlist_content = this.playlist_data.playlistContents.map(
		// 	(c: any) => {
		// 		return new API_CREATE_PLAYLIST_CONTENT(
		// 			c.contentId,
		// 			c.handlerId,
		// 			counter++,
		// 			c.isFullScreen
		// 		)
		// 	}
		// )

		// this.cloned_playlist = new API_CREATE_PLAYLIST(
		// 	this.playlist_data.playlist.dealerId,
		// 	this.f.playlist_title.value,
		// 	this.playlist_data.playlist.playlistType,
		// 	this.f.playlist_description.value,
		// 	this.cloned_playlist_content
		// )

		this.cloned_playlist = {
			playlistId: this.playlist_data.playlist.playlistId,
			playlistName: this.f.playlist_title.value,
			playlistDescription: this.f.playlist_description.value
		};

		this.subscription.add(
			this._playlist.clone_playlist(this.cloned_playlist).subscribe(
				(data) => {
					this.form_submitted = false;
					this.clone_success = true;
					this.redirectToClonedPlaylist(data.playlistId);
				},
				(error) => {}
			)
		);
	}

	redirectToClonedPlaylist(id) {
		if (id) {
			this._router.navigate([`/${this._role.get_user_role()}/playlists/`, id]);
		}
	}
}
