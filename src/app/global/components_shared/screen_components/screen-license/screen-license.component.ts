import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService, LicenseService, PlaylistService, RoleService, ScreenService } from 'src/app/global/services';
import { API_BLOCKLIST_CONTENT, API_LICENSE, UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-screen-license',
	templateUrl: './screen-license.component.html',
	styleUrls: ['./screen-license.component.scss']
})
export class ScreenLicenseComponent implements OnInit {
	assign_success: boolean = false;
	assigned_licenses = [];
	assigning_license: boolean = false;
	licenses: API_LICENSE['license'][] = [];
	no_selected_license: boolean = true;
	zone_contents: any[] = [];
	to_blacklist: any[] = [];
	blacklisting: boolean = false;
	role: any;

	hasNoData = false;
	private licenseId: string;
	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: { screen_id: string; license_id: string; zone_contents: any[] },
		private _dialog: MatDialog,
		private _license: LicenseService,
		private _screen: ScreenService,
		private _router: Router,
		private _auth: AuthService,
		private _role: RoleService,
		private _playlist: PlaylistService
	) {}

	ngOnInit() {
		if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			this.role = UI_ROLE_DEFINITION_TEXT.administrator;
		} else {
			this.role = this._auth.current_role;
		}
		this.licenseId = this._dialog_data.license_id;
		this.zone_contents = this._dialog_data.zone_contents;
		this.getLicenses();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	licenseAssigned(license_id, e) {
		// Convert to a Model
		const screenLicense = {
			licenseId: license_id,
			screenId: this._dialog_data.screen_id
		};

		// Temp fix: angular material checkbox event too fast
		setTimeout(() => {
			if (e.checked == true) {
				this.assigned_licenses.push(screenLicense);
				this.blacklistPlaylistContents(license_id);
			} else {
				this.assigned_licenses.splice(this.assigned_licenses.indexOf(screenLicense), 1);
				this.removeToBlacklist(license_id);
			}

			if (this.assigned_licenses.length > 0) {
				this.no_selected_license = false;
			} else {
				this.no_selected_license = true;
			}
		}, 0);
	}

	assignLicenses() {
		const licenseScreens = { licenseScreens: this.assigned_licenses };

		this.assigning_license = true;

		if (this.assigning_license) {
			this._screen
				.assign_license(licenseScreens)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					() => {
						if (this.to_blacklist.length > 0) {
							this.blacklistAddedContents();
						} else {
							this.assign_success = true;
							this.assigning_license = false;
							const url = `/${this.roleRoute}/screens/`;
							this._router.navigate([url, this._dialog_data.screen_id]);
						}
					},
					(error) => {
						this.warningModal('error', 'Oh Snap!', 'Failed to assign license to this screen.', null, null);
					}
				);
		}
	}

	blacklistPlaylistContents(licenseId: string) {
		if (this.zone_contents.length > 0) {
			this.zone_contents.forEach((zone) => {
				zone.contents.map((c) => {
					this.to_blacklist.push(new API_BLOCKLIST_CONTENT(licenseId, c.content_id, c.playlist_content_id));
				});
			});
		}
	}

	removeToBlacklist(licenseId: string) {
		this.to_blacklist = this.to_blacklist.filter((b) => {
			return b.licenseId !== licenseId;
		});
	}

	blacklistAddedContents() {
		this.blacklisting = true;

		this._playlist
			.blocklist_content(this.to_blacklist)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => {
				this.assign_success = true;
				this.assigning_license = false;
				const url = `/${this.roleRoute}/screens/`;
				this._router.navigate([url, this._dialog_data.screen_id]);
			});
	}

	warningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
		this._dialog.closeAll();

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		const url = `/${this.roleRoute}/screens/`;
		dialogRef.afterClosed().subscribe(() => this._router.navigate([url, this._dialog_data.screen_id]));
	}

	private getLicenses(): void {
		this.licenses = [];

		this._license
			.get_licenses_by_host_id(this.licenseId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (!Array.isArray(response)) {
						this.hasNoData = true;
						return;
					}

					this.licenses = response;
				},
				(error) => {
					console.error(error);
				}
			);
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
