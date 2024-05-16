import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UI_ROLE_DEFINITION } from 'src/app/global/models';
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
    sidebar_routes = [];

    ngOnInit() {
        this._activated_route.data.subscribe((data) => {
            this.current_role = data.role;

            // Setting up sidebar routes depending on the active user role
            this.sidebar_routes = [
                { path: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
                { path: 'hosts', label: 'Hosts', icon: 'fas fa-map' },
                { path: 'licenses', label: 'Licenses', icon: 'fas fa-barcode' },
                { path: 'advertisers', label: 'Advertisers', icon: 'fas fa-ad' },
                { path: 'locator', label: 'Locator', icon: 'fas fa-map-marker' },
                {
                    path: 'tags',
                    label: 'Tags',
                    icon: 'fas fa-tags',
                    hidden: this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'],
                },
                { path: 'media-library', label: 'Media Library', icon: 'fas fa-photo-video' },
                { path: 'feeds', label: 'Feeds', icon: 'fas fa-newspaper' },
                {
                    path: 'fillers',
                    label: 'Fillers Library',
                    icon: 'fas fa-film',
                    hidden: this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'],
                },
                { path: 'playlists', label: 'Playlists', icon: 'fas fa-play' },
                {
                    path: 'screens',
                    label: 'Screens',
                    icon: 'fas fa-tv',
                    hidden: this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'],
                },
                {
                    path: 'reports',
                    label: 'Reports',
                    icon: 'fas fa-chart-area',
                    hidden: this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'],
                },
                {
                    path: 'users',
                    label: 'Users',
                    icon: 'fas fa-users',
                    hidden: this.current_role !== UI_ROLE_DEFINITION.dealer,
                },
            ];

            if (!this.current_role.includes(this._auth.current_user_value.role_id)) {
                this._auth.logout();
            }

            return true;
        });
    }

    receiveToggle($event) {
        this.toggle = $event;
    }
}
