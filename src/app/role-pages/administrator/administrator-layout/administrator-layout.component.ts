import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../global/services/auth-service/auth.service';
import {
    UI_ROLE_DEFINITION_TEXT,
    UI_ROLE_DEFINITION,
} from '../../../global/models/ui_role-definition.model';

@Component({
    selector: 'app-administrator-layout',
    templateUrl: './administrator-layout.component.html',
    styleUrls: ['./administrator-layout.component.scss'],
})
export class AdministratorLayoutComponent implements OnInit {
    current_role: string;
    toggle: boolean;
    is_dealer_admin: boolean = false;

    receiveToggle($event) {
        this.toggle = $event;
    }

    sidebar_routes = [
        { path: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
        { path: 'dealers', label: 'Dealers', icon: 'fas fa-suitcase' },
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
        { path: 'installations', label: 'Installations', icon: 'fas fa-calendar' },
        { path: 'users', label: 'Users', icon: 'fas fa-users' },
        { path: 'templates', label: 'Templates', icon: 'fas fa-th-large' },
        { path: 'directory', label: 'Directory', icon: 'fas fa-sitemap' },
        { path: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' },
    ];

    dealeradmin_sidebar_routes = [
        { path: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
        { path: 'dealers', label: 'Dealers', icon: 'fas fa-suitcase' },
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
        { path: 'installations', label: 'Installations', icon: 'fas fa-calendar' },
        { path: 'users', label: 'Users', icon: 'fas fa-users' },
        { path: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' },
    ];

    _socket: any;

    constructor(
        private _auth: AuthService,
        private _activated_route: ActivatedRoute,
    ) {}

    ngOnInit() {
        if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            this.is_dealer_admin = true;
        }
        this._activated_route.data.subscribe((data) => {
            this.current_role = data.role[0];
            if (
                this._auth.current_user_value.role_id === this.current_role ||
                this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealeradmin
            ) {
                return true;
            } else {
                this._auth.logout();
            }
        });
    }
}
