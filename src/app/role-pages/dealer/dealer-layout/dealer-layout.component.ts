import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Component({
    selector: 'app-dealer-layout',
    templateUrl: './dealer-layout.component.html',
    styleUrls: ['./dealer-layout.component.scss'],
})
export class DealerLayoutComponent {
    constructor(
        private _auth: AuthService,
        private _activated_route: ActivatedRoute,
    ) {}

    current_role: string;
    public toggle: boolean;
    sidebar_routes = [
        { path: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
        { path: 'hosts', label: 'Hosts', icon: 'fas fa-map' },
        { path: 'licenses', label: 'Licenses', icon: 'fas fa-barcode' },
        { path: 'advertisers', label: 'Advertisers', icon: 'fas fa-ad' },
        { path: 'locator', label: 'Locator', icon: 'fas fa-map-marker' },
        { path: 'tags', label: 'Tags', icon: 'fas fa-tags' },
        { path: 'media-library', label: 'Media Library', icon: 'fas fa-photo-video' },
        { path: 'feeds', label: 'Feeds', icon: 'fas fa-newspaper' },
        { path: 'fillers', label: 'Fillers Library', icon: 'fas fa-film' },
        { path: 'playlists', label: 'Playlists', icon: 'fas fa-play' },
        { path: 'screens', label: 'Screens', icon: 'fas fa-tv' },
        //{ path: 'billings', label: 'Billings', icon: 'fas fa-file-invoice-dollar '},
        { path: 'reports', label: 'Reports', icon: 'fas fa-chart-area' },
        { path: 'users', label: 'Users', icon: 'fas fa-users' },
    ];

    ngOnInit() {
        this._activated_route.data.subscribe((data) => {
            this.current_role = data.role[0];
            if (this._auth.current_user_value.role_id === this.current_role) {
                return true;
            } else {
                this._auth.logout();
            }
        });
    }

    receiveToggle($event) {
        this.toggle = $event;
    }
}
