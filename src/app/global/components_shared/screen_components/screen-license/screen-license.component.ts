import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material'
import { Subscription, Observable } from 'rxjs';
import { ScreenService } from '../../../services/screen-service/screen.service';
import { LicenseService } from '../../../services/license-service/license.service';
import { API_LICENSE } from '../../../../global/models/api_license.model';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../../models/ui_role-definition.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { RoleService } from 'src/app/global/services/role-service/role.service';
import { API_BLOCKLIST_CONTENT } from 'src/app/global/models/api_blocklist-content.model';
import { PlaylistService } from 'src/app/global/services/playlist-service/playlist.service';

@Component({
	selector: 'app-screen-license',
	templateUrl: './screen-license.component.html',
	styleUrls: ['./screen-license.component.scss']
})

export class ScreenLicenseComponent implements OnInit {
	assign_success: boolean = false;
	assigned_licenses = [];
	assigning_license:boolean = false;
	license$: Observable<API_LICENSE['license'][]>;
	subscription: Subscription = new Subscription();
	no_selected_license: boolean = true;
	zone_contents: any[] = [];
	to_blacklist: any[] = [];
	blacklisting: boolean = false;

	constructor(
		private _dialog: MatDialog,
		private _license: LicenseService,
		private _screen: ScreenService,
		private _router: Router,
		private _auth: AuthService,
		private _role: RoleService,
		private _playlist: PlaylistService,
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any
	) { }

	ngOnInit() {
		this.zone_contents = this._dialog_data.zone_contents
		this.license$ = this._license.get_license_by_host_id(this._dialog_data.license_id);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	licenseAssigned(license_id, e) {
		console.log(license_id, e)

		// Convert to a Model
		const screenLicense = {
			licenseId: license_id,
			screenId: this._dialog_data.screen_id
		}

		// Temp fix: angular material checkbox event too fast 
		setTimeout(() => {
			if (e.checked == true) {
				this.assigned_licenses.push(screenLicense)
				this.blacklistPlaylistContents(license_id);
			} else {
				this.assigned_licenses.splice(this.assigned_licenses.indexOf(screenLicense), 1);
				this.removeToBlacklist(license_id)
			}
			
			if (this.assigned_licenses.length > 0) {
				this.no_selected_license = false;
			} else {
				this.no_selected_license = true;
			}

			console.log(this.assigned_licenses);
		}, 0)

	}

	assignLicenses() {
		const licenseScreens = {
			licenseScreens: this.assigned_licenses
		}

		this.assigning_license = true;

		if (this.assigning_license) {
			this.subscription.add(
				this._screen.assign_license(licenseScreens).subscribe(
					data => {
						if (this.to_blacklist.length > 0) {
							this.blacklistAddedContents();
						} else {
							this.assign_success = true;
							this.assigning_license = false;
							const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
							this._router.navigate([`/${route}/screens/`, this._dialog_data.screen_id]);
						}
					}, 
					error => {
						this.warningModal('error', 'Oh Snap!', 'Failed to assign license to this screen.', null, null);
					}
				)
			)
		}
	}

	blacklistPlaylistContents(licenseId) {
		if (this.zone_contents.length > 0) {
			this.zone_contents.forEach(
				zone => {
					zone.contents.map(c => {
						this.to_blacklist.push(new API_BLOCKLIST_CONTENT(licenseId, c.content_id, c.playlist_content_id))
					})
				}
			)
		}

	}

	removeToBlacklist(licenseId) {
		this.to_blacklist = this.to_blacklist.filter(
			b => {
				return b.licenseId !== licenseId
			}
		)

	}

	blacklistAddedContents() {
		this.blacklisting = true;

		this.subscription.add(
			this._playlist.blocklist_content(this.to_blacklist).subscribe(
				data => {
					this.assign_success = true;
					this.assigning_license = false;
					const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
					this._router.navigate([`/${route}/screens/`, this._dialog_data.screen_id]);
				}
			)
		)
	}

	warningModal(status, message, data, return_msg, action): void {
		this._dialog.closeAll();
		
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data,
				return_msg: return_msg,
				action: action
			}
		})

		dialogRef.afterClosed().subscribe(() => {
			this._router.navigate([`/${this._role.get_user_role()}/screens/`, this._dialog_data.screen_id]);
		});
	}
}
