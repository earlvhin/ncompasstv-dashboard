import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Component({
    selector: 'app-sub-dealer-layout',
    templateUrl: './sub-dealer-layout.component.html',
    styleUrls: ['./sub-dealer-layout.component.scss'],
})
export class SubDealerLayoutComponent implements OnInit, OnDestroy {
    toggle: boolean;

    sidebar_routes = [
        { path: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
        { path: 'hosts', label: 'Hosts', icon: 'fas fa-map' },
        { path: 'licenses', label: 'Licenses', icon: 'fas fa-barcode' },
        { path: 'advertisers', label: 'Advertisers', icon: 'fas fa-ad' },
        { path: 'locator', label: 'Locator', icon: 'fas fa-map-marker' },
        { path: 'media-library', label: 'Media Library', icon: 'fas fa-photo-video' },
        { path: 'feeds', label: 'Feeds', icon: 'fas fa-newspaper' },
        { path: 'playlists', label: 'Playlists', icon: 'fas fa-play' },
        { path: 'screens', label: 'Screens', icon: 'fas fa-tv' },
    ];

    private current_role: string;
    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _activated_route: ActivatedRoute,
    ) {}

    ngOnInit() {
        this._activated_route.data.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
            this.current_role = data.role[0];
            if (this._auth.current_user_value.role_id === this.current_role) return true;
            else this._auth.logout();
        });
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    receiveToggle(event: any): void {
        this.toggle = event;
    }
}
