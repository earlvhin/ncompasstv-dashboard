import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sub-dealer-layout',
  templateUrl: './sub-dealer-layout.component.html',
  styleUrls: ['./sub-dealer-layout.component.scss']
})
export class SubDealerLayoutComponent implements OnInit {

    toggle: boolean;

	sidebar_routes = [
		{ path: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line'},
		{ path: 'hosts', label: 'Hosts', icon: 'fas fa-map'},
		{ path: 'licenses', label: 'Licenses', icon: 'fas fa-barcode'},
		{ path: 'advertisers', label: 'Advertisers', icon: 'fas fa-ad'},
		{ path: 'locator', label: 'Locator', icon: 'fas fa-map-marker'},
		{ path: 'media-library', label: 'Media Library', icon: 'fas fa-photo-video'},
		{ path: 'feeds', label: 'Feeds', icon: 'fas fa-newspaper'},
		{ path: 'playlists', label: 'Playlists', icon: 'fas fa-play'},
		{ path: 'screens', label: 'Screens', icon: 'fas fa-tv'},
		{ path: 'users', label: 'Users', icon: 'fas fa-users'},
	];

	receiveToggle(event) {
		this.toggle = event
	}

	constructor() { }

	ngOnInit() {
	}

}
