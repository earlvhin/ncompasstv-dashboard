import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../global/services/auth-service/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-administrator-layout',
	templateUrl: './administrator-layout.component.html',
	styleUrls: ['./administrator-layout.component.scss']
})

export class AdministratorLayoutComponent implements OnInit {

	current_role: string;
	public toggle: boolean;
	
	receiveToggle($event) {
		this.toggle = $event
	}

	sidebar_routes = [
		{ path: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line'},
		{ path: 'dealers', label: 'Dealers', icon: 'fas fa-suitcase'},
		{ path: 'hosts', label: 'Hosts', icon: 'fas fa-map'},
		{ path: 'licenses', label: 'Licenses', icon: 'fas fa-barcode'},
		{ path: 'advertisers', label: 'Advertisers', icon: 'fas fa-ad'},
		{ path: 'locator', label: 'Locator', icon: 'fas fa-map-marker'},
		// { path: 'categories', label: 'Categories', icon: 'fas fa-stream'},
		{ path: 'media-library', label: 'Media Library', icon: 'fas fa-photo-video'},
		{ path: 'feeds', label: 'Feeds', icon: 'fas fa-newspaper'},
		{ path: 'playlists', label: 'Playlists', icon: 'fas fa-play'},
		{ path: 'screens', label: 'Screens', icon: 'fas fa-tv'},
		{ path: 'installations', label: 'Installations', icon: 'fas fa-calendar'},
		// { path: 'billings', label: 'Billings', icon: 'fas fa-file-invoice-dollar '},
		// { path: 'reports', label: 'Reports', icon: 'fas fa-chart-area'},
		{ path: 'users', label: 'Users', icon: 'fas fa-users'},
		// { path: 'roles', label: 'Roles', icon: 'fas fa-pencil-ruler'},
		{ path: 'templates', label: 'Templates', icon: 'fas fa-th-large'},
		{ path: 'directory', label: 'Directory', icon: 'fas fa-sitemap'},
	]

	constructor(
		private _auth: AuthService,
		private _activated_route: ActivatedRoute
	) { }

	ngOnInit() {
		this._activated_route.data.subscribe(
			data => {
				this.current_role = data.role[0];
				if (this._auth.current_user_value.role_id === this.current_role) {
					return true;
				} else {
					this._auth.logout();
				}
			}
		)
	}
}
