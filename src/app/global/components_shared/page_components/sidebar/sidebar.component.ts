import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService, HelperService, LicenseService } from 'src/app/global/services';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
    @Input() routes: { path: string; label: string; icon: string }[];
    @Output() toggleEvent = new EventEmitter<boolean>();
    icons_only = false;
    is_dealer_admin = false;
    installations_count = 0;
    isAdmin = false;
    isDealer = false;
    isDealerAdmin = false;

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _helper: HelperService,
        private _license: LicenseService,
        private _router: Router,
    ) {}

    ngOnInit() {
        if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) this.is_dealer_admin = true;

        this._router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(
            (event: NavigationEnd) => {
                if (event.url.match(/dealers.*/) || event.url.match(/licenses.*/)) {
                    this.icons_only = true;
                    this.toggleEvent.emit(this.icons_only);
                }
            },
            (error) => {
                console.error(error);
            },
        );

        if (this.currentUser) {
            const { role_id } = this.currentUser;
            const subDealer = UI_ROLE_DEFINITION['sub-dealer'];
            this.isAdmin = role_id === UI_ROLE_DEFINITION.administrator;
            this.isDealerAdmin = role_id === UI_ROLE_DEFINITION.dealeradmin;
            this.isDealer = role_id === UI_ROLE_DEFINITION.dealer || role_id === subDealer;

            if (!this.isDealer) {
                this.getInstallationStats();
                this.subscribeToUpdateInstallationDate();
            }
        }
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    toggleSideBar(): void {
        this.icons_only = !this.icons_only;
        this.toggleEvent.emit(this.icons_only);
    }

    private getInstallationStats(): void {
        this._license
            .get_installation_statistics()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.installations_count = response.licenseInstallationStats.total;
            });
    }

    private get currentUser() {
        return this._auth.current_user_value;
    }

    private subscribeToUpdateInstallationDate() {
        this._helper.onUpdateInstallationDate
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(() => this.getInstallationStats());
    }
}
