import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { MatDialog } from '@angular/material';
import { ScreenService } from '../../services/screen-service/screen.service';
import { PlaylistService } from '../../services/playlist-service/playlist.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { API_SINGLE_SCREEN, API_SCREEN_TEMPLATE_ZONE, API_SCREEN_ZONE_PLAYLISTS_CONTENTS } from '../../models/api_single-screen.model';
import { UI_SINGLE_SCREEN, UI_SCREEN_ZONE_PLAYLIST, UI_ZONE_PLAYLIST, UI_SCREEN_LICENSE_SCREENS } from '../../models/ui_single-screen.model';
import { API_CONTENT } from '../../models/api_content.model';
import { API_LICENSE, API_LICENSE_PROPS } from '../../models/api_license.model';
import { UI_CONTENT } from '../../models/ui_content.model';
import { API_SINGLE_PLAYLIST } from '../../models/api_single-playlist.model';
import { EDIT_SCREEN_ZONE_PLAYLIST, EDIT_SCREEN_INFO } from '../../models/api_edit-screen.model';
import { HostService } from '../../services/host-service/host.service';
import { TemplateService } from '../../services/template-service/template.service';
import { API_HOST } from '../../models/api_host.model';
import { API_TEMPLATE } from '../../models/api_template.model';
import { ScreenLicenseComponent } from '../../components_shared/screen_components/screen-license/screen-license.component';
import { CloneScreenComponent } from '../../components_shared/screen_components/clone-screen/clone-screen.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../models/ui_role-definition.model';
import { LicenseService } from '../../services/license-service/license.service';
import { RoleService } from '../../services/role-service/role.service';
import { UnassignLicenseComponent } from '../../components_shared/screen_components/unassign-license/unassign-license.component';

@Component({
	selector: 'app-single-screen',
	templateUrl: './single-screen.component.html',
	styleUrls: ['./single-screen.component.scss']
})

export class SingleScreenComponent implements OnInit {

	dealer_playlist$: Observable<API_SINGLE_PLAYLIST[]>;
	dealer_hosts: API_HOST[] = [];
	edit_screen_info: EDIT_SCREEN_INFO;
	edit_screen_zone_playlist: EDIT_SCREEN_ZONE_PLAYLIST[];
	hosts_data: Array<any> = [];
	initial_load: boolean = false;
	is_dealer: boolean = false;
	is_search: boolean = false;
	licenses_array: any;
	licenses_array_api: any;
	license_tbl_row_url: string;
	license_tbl_row_slug: string = "license_id";
	loading_data_host: boolean = true;
	loading_search: boolean = false;
	loading_search_host: boolean = false;
	no_case: boolean = true;
	no_changes: boolean = true;
	paging_host: any;
	playlist_id: string;
	playlist_route: string;
	playlist_contents: UI_CONTENT[];
	screen: UI_SINGLE_SCREEN;
	screen_init: string;
	screen_types: Array<any> = [];
	search_host_data: string = "";
	screen_id: string;
	screen_info: FormGroup;
	subscription: Subscription = new Subscription;
	screen_zone_playlist_contents: UI_SCREEN_ZONE_PLAYLIST[];
	screen_template: UI_ZONE_PLAYLIST;
	screen_zone: any;
	templates: any;
	
	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _host: HostService,
		private _license: LicenseService,
		private _params: ActivatedRoute,
		private _playlist: PlaylistService,
		private _role: RoleService,
		private _router: Router,
		private _screen: ScreenService,
		private _template: TemplateService,
	) { }

	license_column = [
		'#',
		'License Key',
		'Alias',
		'Internet Type',
		'Internet Speed'
	]

	screen_form = [
		{
			label: 'Screen Title',
			control: 'screen_title',
			width: 'col-lg-12'
		},
		{
			label: 'Description',
			control: 'description',
			width: 'col-lg-12'
		},
		{
			label: 'Screen Type',
			control: 'type',
			width: 'col-lg-4',
			type: 'dropdown'
		},
		{
			label: 'Published By',
			control: 'published_by',
			width: 'col-lg-4'
		},
		{
			label: 'Business Name',
			control: 'business_name',
			width: 'col-lg-4'
		},
		{
			label: 'Host',
			control: 'assigned_host',
			width: 'col-lg-6'
		},
		{
			label: 'Template',
			control: 'template',
			width: 'col-lg-6'
		},
		{
			label: 'Notes',
			control: 'notes',
			width: 'col-lg-12',
			type: 'textarea'
		}
	]

	ngOnInit() {
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		}

		// Queried Object ID
		this.getScreenIdOnRoute();
		this.getScreenType();
		this.license_tbl_row_url = `/${this._role.get_user_role()}/licenses/`
		this.playlist_route = `/${this._role.get_user_role()}/playlists/`
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	getScreenIdOnRoute() {
		this.subscription.add(
			this._params.paramMap.subscribe(
				data => {
					this.screen_id = this._params.snapshot.params.data;
					if(this._params.snapshot.queryParams.pid) {
						this.playlist_id = this._params.snapshot.queryParams.pid;
					}
					this.getScreenById(this.screen_id);
				}
			)
		)
	}

	getScreenById(id) {
		this.subscription.add(
			this._screen.get_screen_by_id(id).subscribe(
				(data: API_SINGLE_SCREEN) => {
					this.licenses_array_api = data.licenses;
					this.sortList('desc');

					//sort screen zone template by order
					data.screenZonePlaylistsContents = data.screenZonePlaylistsContents.sort((a,b)=>a.screenTemplateZonePlaylist.order - b.screenTemplateZonePlaylist.order);
					
					this.screen = this.screen_mapToUI(data);
					this.edit_screen_zone_playlist = data.screenZonePlaylistsContents.map(
						(i: API_SCREEN_ZONE_PLAYLISTS_CONTENTS) => {
							return new EDIT_SCREEN_ZONE_PLAYLIST(
								i.screenTemplateZonePlaylist.templateZoneId,
								i.screenTemplateZonePlaylist.playlistId
							)
						}
					)
					this.getPlaylistByDealer(this.screen.assigned_dealer_id);
					this.getHostByDealer(1);
					this.getTemplate();
					
					// Form Screen Information
					this.screen_info = this._form.group(
						{
							screen_title: [this.screen.screen_title, Validators.required],
							description: [this.screen.description],
							type: [{ value: this.screen.type ? this.screen.type : null, disabled: this.is_dealer ? true:false}],
							published_by: [{ value: this.screen.created_by, disabled: true }, Validators.required],
							business_name: [{ value: this.screen.assigned_dealer, disabled: true }, Validators.required],
							assigned_host: [{value: this.screen.assigned_host, disabled: true}, Validators.required],
							template: [{ value: this.screen.assigned_template, disabled: true}, Validators.required],
							notes: [{ value: this.screen.notes ? this.screen.notes : '', disabled: true }]
						}
					)
					setTimeout(() => {
						this.watchScreenInfo();	
					}, 50);
				}
			)
		)
	}

	toggleActivateDeactivate(e) {
		if (e.status) {
			this.activateLicense(e.id);
		} else {
			this.deactivateLicense(e.id);
		}
	}

	activateLicense(e) {
		this.subscription.add(
			this._license.activate_license(e).subscribe(
				data => {
					// console.log('License is Activated -', e);
				}
			)
		)
	}

	deactivateLicense(e) {
		this.subscription.add(
			this._license.deactivate_license(e).subscribe(
				data => {
					// console.log('License is Deactivated -', e);
				}
			)
		)
	}

	// Convenience getter for easy access to form fields
	get s() { return this.screen_info.controls; }

	// Watch changes of Screen Info Form
	watchScreenInfo() {
		this.subscription.add(
			this.screen_info.valueChanges.subscribe(
				data => {				
					this.no_changes = false;
				}
			)
		)
	}

	// Clone Screen
	cloneScreen() {
		let dialog = this._dialog.open(CloneScreenComponent, {
			minWidth: '500px',
			minHeight: '500px',
			data: this.screen,
			panelClass: 'no-overflow'
		});

		this.subscription.add(
			dialog.afterClosed().subscribe(
				data => {
					// console.log(data);
				}
			)
		)
	}

	deleteScreen() {
		let delete_dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'warning',
				message: 'Delete Screen',
				data: 'Are you sure you want to delete this screen',
				return_msg: '',
				action: 'delete'
			}
		})

		delete_dialog.afterClosed().subscribe(result => {
			if(result == 'delete') {
				var array_to_delete = [];
				array_to_delete.push(this.screen_id);
				this.subscription.add(
					this._screen.delete_screen(array_to_delete).subscribe(
						data => {
							const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
							this._router.navigate([`/${route}/screens`]);
						}, 
						error => {
							// console.log('error', error);
						}
					)
				)
			} else {}
		} );
	}

	// Structure of Edit Screen Body
	editScreenInfo() {
		// Set Edit Screen Info

		this.edit_screen_info = new EDIT_SCREEN_INFO(
			this.screen_id,
			this.s.screen_title.value,
			this.s.description.value,
			this.screen.type,
			this.screen.assigned_host_id,
			this.screen.assigned_template_id
		)

		// Structure Data to be sent
		const final_screen_info = {
			screen: (this.edit_screen_info != undefined) ? this.edit_screen_info : this.screen_info.value,
			screenZonePlaylists: this.edit_screen_zone_playlist
		}

		// Send Data to API
		this.subscription.add(
			this._screen.edit_screen(final_screen_info).subscribe(
				data => {
					this.no_changes = true;
					this.ngOnInit();
					// console.log('editScreenInfo', data);
				}
			)
		)
	}

	// Get Playlist By Dealer ID
	getPlaylistByDealer(id) {
		this.dealer_playlist$ = this._playlist.get_playlist_by_dealer_id(id);
	}

	hostSearchBoxTrigger (event) {
		this.is_search = event.is_search;
		if(this.is_search) {
			this.search_host_data = "";
		}
		this.getHostByDealer(event.page);
	}

	searchHostData(e) {
		this.search_host_data = e;
		this.getHostByDealer(1);
	}

	// Get Host By Dealer
	getHostByDealer(e) {
		this.loading_data_host = true;
		if(e > 1) {
			this.subscription.add(
				this._host.get_host_by_dealer_id(this.screen.assigned_dealer_id, e, this.search_host_data).subscribe(
					data => {
						data.hosts.map (
							i => {
								this.dealer_hosts.push(i.host);
								this.hosts_data.push(i.host);
							}
						)
						this.paging_host = data.paging;
						this.loading_data_host = false;
					}
				)
			)
		} else {
			this.hosts_data = [];
			this.initial_load = false;
			if(this.is_search || this.search_host_data != "") {
				this.loading_search_host = true;
			}
			this.subscription.add(
				this._host.get_host_by_dealer_id(this.screen.assigned_dealer_id, e, this.search_host_data).subscribe(
					data => {
						if(!data.message) {
							if(this.search_host_data == "") {
								data.hosts.map (
									i => {
										this.dealer_hosts.push(i.host);
										this.hosts_data.push(i.host);
									}
								)
							} else {
								if (data.paging.entities.length > 0) {
									this.hosts_data = data.paging.entities;
									this.loading_search = false;
								}
							}
							this.paging_host = data.paging;
						} else {
							this.screen.assigned_host_id = "";
							if(this.search_host_data != "") {
								this.hosts_data = [];
								this.loading_search = false;
							}
						}
						this.loading_data_host = false;
						this.loading_search_host = false;
					}
				)
			)
		}
	}

	// Get Templates
	getTemplate() {
		this.subscription.add(
			this._template.get_templates().subscribe(
				(data: API_TEMPLATE[]) => {
					this.templates = data.map(
						(t: API_TEMPLATE) => {
							return (
								{
									template_id: t.template.templateId,
									template_name: t.template.name
								}
							)
						}
					)
				}
			)
		)
	}

	// Host is Selected
	hostSelected(data) {
		// console.log(data);
		this.screen.assigned_host_id = data;
	}

	// Open Assign License Modal
	assignLicenseModal_open() {
		// console.log('#screen', this.screen)
		let dialog = this._dialog.open(ScreenLicenseComponent, {
			data: { license_id: this.screen.assigned_host_id , screen_id: this.screen.screen_id, zone_contents: this.screen.screen_zone_playlist },
		});

		this.subscription.add(
			dialog.afterClosed().subscribe(
				data => {
					// console.log(data);
					this.ngOnInit();
				}
			)
		)
	}

	unassignLicenseModal_open() {
		let dialog = this._dialog.open(UnassignLicenseComponent, {
			data: { licenses: this.licenses_array_api, screen_id: this.screen.screen_id },
		});

		this.subscription.add(
			dialog.afterClosed().subscribe(
				data => {
					if (data == true) {
						this.getScreenById(this.screen_id);
						this.licenseUnassigned();
					}
				}
			)
		)
	}

	licenseUnassigned() {
		this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'success',
				message: 'License Successfully',
				data: 'Press OK to continue.'
			}
		})
	}

	// Playlist is selected
	playlistSelected(playlist_id, zone_id){
		this.edit_screen_zone_playlist.forEach(
			z => {
				if(z.templateZoneId ===  zone_id && z.playlistId !== playlist_id) {
					this.no_changes = false;
					z.playlistId = playlist_id;
				}
			}
		)
	}

	//Unassign Playlist
	unassignPlaylist(zone_id){
		this.edit_screen_zone_playlist.forEach(
			z => {
				if(z.templateZoneId ===  zone_id) {
					this.no_changes = false;
					z.playlistId = "";
				}
			}
		)
		this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'success',
				message: 'Playlist Successfully Removed',
				data: 'Press OK to continue.'
			}
		})
		this.editScreenInfo();
	
	}

	// Playlist Contents and Properties Map to UI
	playlistContent_mapToUI(data: API_CONTENT[]) {
		if (data) {
			return data.map(
				(c: API_CONTENT) => {
					return new UI_CONTENT(
						c.playlistContentId,
						c.createdBy,
						c.contentId,
						c.createdByName,
						c.dealerId,
						c.duration,
						c.hostId,
						c.advertiserId,
						c.fileName,
						c.url,
						c.fileType,
						c.handlerId,
						c.dateCreated,
						c.isFullScreen,
						c.filesize,
						c.thumbnail,
						c.isActive,
						c.isConverted,
						c.uuid
					)
				}
			)
		}
	}

	// Final UI Data Model
	screen_mapToUI(data: API_SINGLE_SCREEN) {
		console.log("TEMPLETE", data.template)
		const screen = new UI_SINGLE_SCREEN (
			data.screen.screenId,
			data.screen.screenName,
			data.screen.description,
			// data.screen.screenTypeId,
			data.dealer.dealerId,
			data.dealer.businessName,
			(data.host.hostId != null) ? data.host.hostId : '',
			(data.host.name != null) ? data.host.name : '',
			(data.template.templateId != null) ? data.template.templateId : '',
			(data.template.name != null) ? data.template.name : '',
			`${data.createdBy.firstName} ${data.createdBy.lastName}`,
			'',
			this.screenZone_mapToUI(data.screenZonePlaylistsContents),
			this.screenLicense_mapToUI(this.licenses_array)
		);

		
		if(data.screen.screenTypeId != null) {
			screen.type = data.screen.screenTypeId;
		}

		if (data.host.notes && data.host.notes.trim().length > 0) {
			screen.notes = data.host.notes;

		}

		return screen;
	}

	getScreenType() {
		this.subscription.add(
			this._screen.get_screens_type().subscribe(
				data => {
					this.screen_types = data;
				}
			)
		)
	}

	sortList(order) {
		this.licenses_array = [];
		if(order == 'desc') {
			this.licenses_array_api = this.licenses_array_api.sort((a,b) => b.piStatus - a.piStatus);
		} else {
			this.licenses_array_api = this.licenses_array_api.sort((a,b) => a.piStatus - b.piStatus);
		}
		this.licenses_array = this.licenses_array_api;
	}

	// Screen Zone Map to UI
	screenZone_mapToUI(data: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[]) {
		return data.map(
			(s: API_SCREEN_ZONE_PLAYLISTS_CONTENTS) => {
				// console.log('screenZone', data)
				return new UI_SCREEN_ZONE_PLAYLIST(
					this.zonePlaylist_mapToUI(s.screenTemplateZonePlaylist),
					this.playlistContent_mapToUI(s.contents)
				)
			}
		)
	}

	// Get Licenses where THIS screen is playing
	screenLicense_mapToUI(data) {
		let counter = 1;
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		return data.map(
			(l: API_LICENSE_PROPS) => {
				// console.log('API_LICENSE', l);
				return new UI_SCREEN_LICENSE_SCREENS(
					{ value: l.licenseId, link: null , editable: false, hidden: true},
					{ value: counter++, link: null , editable: false, hidden: false},
					{ value: l.licenseKey, link: `/${route}/licenses/` + l.licenseId, editable: false, hidden: false, status: true},
					{ value: l.alias ? l.alias : '--', link: `/${route}/licenses/` + l.licenseId, editable: true, label: 'License Alias', id: l.licenseId, hidden: false},
					{ value: l.internetType ? l.internetType : '--', link: null, editable: false, hidden: false},
					{ value: l.internetSpeed ? l.internetSpeed : '--', link: null, editable: false, hidden: false},
					{ value: l.isActivated, link: null , editable: false, hidden: true},
					{ value: l.isRegistered, link: null , editable: false, hidden: true},
					{ value: l.piStatus, link: null , editable: false, hidden: true},
				)
			}
		)
	}

	// Template Selected
	templateSelected(data) {
		// console.log(data);
		this.s.template.setValue(data);
	}

	// Zone Properties Map to UI
	zonePlaylist_mapToUI(data: API_SCREEN_TEMPLATE_ZONE) {
		return new UI_ZONE_PLAYLIST(
			data.screenId,
			data.templateId,
			data.templateZoneId,
			data.xPos,
			data.yPos,
			data.height,
			data.width,
			data.playlistId,
			data.playlistName,
			data.name,
			data.description,
			data.order
		)
	}
}
