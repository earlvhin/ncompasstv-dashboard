import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as io from 'socket.io-client';

import { environment } from 'src/environments/environment';
import { ScreenLicenseComponent } from 'src/app/global/components_shared/screen_components/screen-license/screen-license.component';
import { CloneScreenComponent } from 'src/app/global/components_shared/screen_components/clone-screen/clone-screen.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UnassignLicenseComponent } from 'src/app/global/components_shared/screen_components/unassign-license/unassign-license.component';
import { ChangeTemplateComponent } from 'src/app/global/components_shared/screen_components/change-template/change-template.component';

import { API_CONTENT, API_HOST, API_LICENSE_PROPS, API_PLAYLIST, API_SCREEN_TEMPLATE_ZONE, API_SCREEN_ZONE_PLAYLISTS_CONTENTS, 
	API_SINGLE_PLAYLIST, API_SINGLE_SCREEN, API_TEMPLATE,  EDIT_SCREEN_ZONE_PLAYLIST, EDIT_SCREEN_INFO, PAGING, UI_CONTENT, 
	UI_ROLE_DEFINITION, UI_SINGLE_SCREEN, UI_SCREEN_ZONE_PLAYLIST, UI_ZONE_PLAYLIST, UI_SCREEN_LICENSE_SCREENS, API_LICENSE } 
from 'src/app/global/models';

import { AuthService, HelperService, HostService, LicenseService, PlaylistService, RoleService, 
	ScreenService, TemplateService } from 'src/app/global/services';

@Component({
	selector: 'app-single-screen',
	templateUrl: './single-screen.component.html',
	styleUrls: ['./single-screen.component.scss']
})

export class SingleScreenComponent implements OnInit {

	dealer_playlist$: Observable<API_SINGLE_PLAYLIST[]>;
	dealer_playlist: any[] = [];
	dealer_hosts: API_HOST[] = [];
	edit_screen_info: EDIT_SCREEN_INFO;
	edit_screen_zone_playlist: EDIT_SCREEN_ZONE_PLAYLIST[];
	host: API_SINGLE_SCREEN['host'];
	hostUrl: string;
	hosts_data: Array<any> = [];
	initial_load: boolean = false;
	is_dealer: boolean = false;
	is_initial_load_for_dealer = true;
	is_search: boolean = false;
	is_view_only = false;
	licenses_array: any[];
	licenses: API_LICENSE['license'][];
	license_tbl_row_url: string;
	license_tbl_row_slug: string = "license_id";
	loading_data_host: boolean = true;
	loading_search: boolean = false;
	loading_search_host: boolean = false;
	no_case: boolean = true;
	no_changes: boolean = true;
    paging_data: any;
	paging_host: any;
	playlist_id: string;
	playlist_route: string;
	playlist_contents: UI_CONTENT[];
	screen: UI_SINGLE_SCREEN;
	screen_init: string;
    screen_licenses: Array<any> = [];
	screen_types: Array<any> = [];
	search_host_data: string = "";
    searching: boolean = false;
	screen_id: string;
	screen_info: FormGroup;
	screen_zone_playlist_contents: UI_SCREEN_ZONE_PLAYLIST[];
	screen_template: UI_ZONE_PLAYLIST;
	screen_zone: any;
	
	private currentTemplate: API_TEMPLATE;
	private screenZonePlaylists: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[];
	private templates: API_TEMPLATE[];

	_socket: any;

	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _helper: HelperService,
		private _host: HostService,
		private _license: LicenseService,
		private _route: ActivatedRoute,
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
	];

	// Convenience getter for easy access to form fields
	get s() { return this.screen_info.controls; }

	ngOnInit() {
		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
            query: 'client=Dashboard__SingleScreenComponent',
		});

		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
		}

		// Queried Object ID
		this.getScreenIdOnRoute();
        this.getScreenLicenses(1);
		this.getScreenType();
		this.license_tbl_row_url = `/${this._role.get_user_role()}/licenses/`;
		this.playlist_route = `/${this._role.get_user_role()}/playlists/`;
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		this._socket.disconnect();
	}

	// Had to change this.screen type to ANY due to extra fields that are non existent in the UI_SINGLE_SCREEN type
	activateLicense(id: string) {
		this._license.activate_license(id).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					const license = this.screen.screen_license.filter(i => i.license_key.value === id)[0];
					console.log('License Activated');
					this._socket.emit('D_activated', license.license_id.value);
				},
				error => console.log('Error activating license', error)
			);
	}

	cloneScreen() {

		const dialog = this._dialog.open(CloneScreenComponent, {
			minWidth: '500px',
			minHeight: '500px',
			data: this.screen,
			panelClass: 'no-overflow'
		});

		dialog.afterClosed()
			.subscribe(
				async (response: boolean) => {
					if (!response) return;
					await this._router.navigate([`/${this.currentRole}/screens/`, this._helper.singleScreenData.screen.screenId]);
					this.setPageData(this._helper.singleScreenData);
					this.getScreenLicenses(1);
					this.getScreenType();
				}
			);
	}

	deactivateLicense(id: string) {
		this._license.deactivate_license(id).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => console.log('License Deactivated'),
				error => console.log('Error deactivating license', error)
			);
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

		delete_dialog.afterClosed().subscribe(
			result => {
				if (result == 'delete') {
					let array_to_delete = [];
					array_to_delete.push(this.screen_id);

					this._screen.delete_screen(array_to_delete).pipe(takeUntil(this._unsubscribe))
						.subscribe(
							() => {
								const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
								this._router.navigate([`/${route}/screens`]);
							},
							error => console.log('Error deleting screen', error)
						);
				}
			} 
		);
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
		this._screen.edit_screen(final_screen_info).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.no_changes = true;
					this.openConfirmationModal('success', 'Success!', 'Screen successfully updated!');
				},
				error => console.log('Error editing screen', error)
			);
	}

	getScreenIdOnRoute() {
		const routeSnapshot = this._route.snapshot;
		const routeParams = routeSnapshot.paramMap;
		this.screen_id = routeParams.get('data');
		if (routeSnapshot.queryParams.pid) this.playlist_id = routeSnapshot.queryParams.pid;
		this.getScreen(this.screen_id);
	}

    getScreenLicenses(page: number) {
        this.searching = true;

		this._license.get_license_by_screen_id(this.screen_id, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					this.searching = false;
					this.paging_data = response.paging;

					if (response.message) {
						this.screen_licenses = [];
						return;
					}

					this.screen_licenses = this.mapToScreenLicenseUI(response.paging.entities);

				}
			);
	}

	// Get Playlist By Dealer ID
	getPlaylistByDealer(id: string | number) {

		this._playlist.get_playlist_by_dealer_id_v2(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { paging: PAGING, playlists: { playlists: API_PLAYLIST[], contents: any }[] }) => {
					const { entities } = response.paging;
					const playlists = entities as API_PLAYLIST[];
					this.dealer_playlist = playlists;
				}, 
				error => console.log('Error retrieving playlists by dealer', error)
			);
			
	}

	// Get Host By Dealer
	getHostByDealer(page: number) {
		this.loading_data_host = true;

		if (page > 1) {

			this._host.get_host_by_dealer_id(this.screen.assigned_dealer_id, page, this.search_host_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					data => {
						if (data && data.paging.entities) {
							data.paging.entities.map(
								i => {
									this.dealer_hosts.push(i);
									this.hosts_data.push(i);
								}
							)
							this.paging_host = data.paging;
							this.loading_data_host = false;
						}
					},
					error => console.log('Error retrieving dealer host', error)
				);

		} else {
			this.hosts_data = [];
			this.initial_load = false;
			if (this.is_search || this.search_host_data != "") this.loading_search_host = true;

			this._host.get_host_by_dealer_id(this.screen.assigned_dealer_id, page, this.search_host_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					data => {

						if (!data.message && data.paging.entities) {
							if (this.search_host_data == "") {

								data.paging.entities.map(
									i => {
										this.dealer_hosts.push(i);
										this.hosts_data.push(i);
									}
								);

							} else {

								if (data.paging.entities.length > 0) {
									this.hosts_data = data.paging.entities;
									this.loading_search = false;

								}
							}

							this.paging_host = data.paging;

						} else {
							this.screen.assigned_host_id = "";

							if (this.search_host_data != "") {
								this.hosts_data = [];
								this.loading_search = false;
							}
						}

						this.loading_data_host = false;
						this.loading_search_host = false;
					},
					error => console.log('Error retrieving dealer host', error)
				);

		}
	}

	getScreenType() {

		this._screen.get_screens_type().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => this.screen_types = data,
				error => console.log('Error retrieving screen type', error)
			);

	}

	hostSearchBoxTrigger(event: { is_search: boolean, page: number }) {
		this.is_search = event.is_search;
		if (this.is_search) this.search_host_data = "";
		this.getHostByDealer(event.page);
	}

	// Host is Selected
	hostSelected(data) {
		this.screen.assigned_host_id = data;
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
		});

	}

	// Open Assign License Modal
	onAssignLicense() {

		const dialog = this._dialog.open(ScreenLicenseComponent, {
			disableClose: true,
			data: { license_id: this.screen.assigned_host_id , screen_id: this.screen.screen_id, zone_contents: this.screen.screen_zone_playlist },
		});

		dialog.afterClosed().subscribe(
			response => {
				if (!response) return;
				this.ngOnInit();
			}
		);
	}

	onChangeTemplate(): void {

		const config: MatDialogConfig = {
			height: '600px',
			minWidth: '800px',
			disableClose: true,
			data: {
				currentTemplate: this.currentTemplate,
				dealerPlaylists: this.dealer_playlist,
				playlistId: this.playlist_id,
				playlistRoute: this.playlist_route,
				screenZonePlaylists: this.screen.screen_zone_playlist,
				templates: this.templates,
			}
		};

		const dialog: MatDialogRef<ChangeTemplateComponent> = this._dialog.open(ChangeTemplateComponent, config);

		dialog.afterClosed().subscribe(
			response => {
				if (!response) return;
			}
		);

	}

	onUnassignLicense() {

		const dialog = this._dialog.open(UnassignLicenseComponent, {
			disableClose: true,
			data: { licenses: this.licenses, screen_id: this.screen.screen_id },
		});

		dialog.afterClosed().subscribe(
			data => {
				if (!data) return;
				this.getScreenLicenses(1);
				this.licenseUnassigned();
			}
		);
	}

	openConfirmationModal(status, message, data): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  { status, message, data }
		})

		dialog.afterClosed().subscribe(() => this.ngOnInit());
	}

	// Playlist is selected
	playlistSelected(playlist_id: string, zone_id: string) {

		this.edit_screen_zone_playlist.forEach(
			z => {
				if(z.templateZoneId ===  zone_id && z.playlistId !== playlist_id) {
					this.no_changes = false;
					z.playlistId = playlist_id;
				}
			}
		);

	}

	searchHostData(keyword: string) {
		this.search_host_data = keyword;
		this.getHostByDealer(1);
	}

	// Template Selected
	templateSelected(data) {
		this.s.template.setValue(data);
	}

	toggleActivateDeactivate(event: { id: string, status: any }) {

		if (event.status) {
			this.activateLicense(event.id);
		} else {
			this.deactivateLicense(event.id);

		}
	}

	//Unassign Playlist
	unassignPlaylist(zone_id: string) {

		this.edit_screen_zone_playlist.forEach(
			z => {
				if (z.templateZoneId ===  zone_id) {
					this.no_changes = false;
					z.playlistId = "";
				}
			}
		);

		this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'success',
				message: 'Playlist Successfully Removed',
				data: 'Press OK to continue.'
			}
		});

		this.editScreenInfo();
	
	}

	// Watch changes of Screen Info Form
	watchScreenInfo() {
		this.screen_info.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.no_changes = false);
	}

	private getInternetType(value: string): string {
		if(value) {
			value = value.toLowerCase();
			if (value.includes('w')) {
				return 'WiFi';
			}
			if (value.includes('eth')) {
				return 'LAN';
			}
		}
	}

	private getScreen(id: string) {

		if (this.is_initial_load_for_dealer && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
			this.setPageData(this._helper.singleScreenData);
			this.is_initial_load_for_dealer = false;
			return;
		}

		this._screen.get_screen_by_id(id).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_SINGLE_SCREEN) => this.setPageData(response),
				error => console.log('Error retrieving screen', error)
			);
	}

	private getTemplates() {

		return this._template.get_templates().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: API_TEMPLATE[]) => this.templates = data,
				error => console.log('Error retrieving templates ', error)
			);

	}

	// Playlist Contents and Properties Map to UI
	private mapToPlaylistContentUI(data: API_CONTENT[]) {
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
			);
		}
	}

	// Get Licenses where THIS screen is playing
	private mapToScreenLicenseUI(data: any) {
		let counter = 1;
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);

		return data.map(
			(l: API_LICENSE_PROPS) => {
				return new UI_SCREEN_LICENSE_SCREENS(
					{ value: l.licenseId, link: null , editable: false, hidden: true},
					{ value: counter++, link: null , editable: false, hidden: false},
					{ value: l.licenseKey, link: `/${route}/licenses/` + l.licenseId, editable: false, hidden: false, status: true},
					{ value: l.alias ? l.alias : '--', link: `/${route}/licenses/` + l.licenseId, editable: true, label: 'License Alias', id: l.licenseId, hidden: false},
					{ value: l.internetType ? this.getInternetType(l.internetType) : '--', link: null, editable: false, hidden: false},
					{ value: l.internetSpeed ? l.internetSpeed : '--', link: null, editable: false, hidden: false},
					{ value: l.isActivated, link: null , editable: false, hidden: true},
					{ value: l.isRegistered, link: null , editable: false, hidden: true},
					{ value: l.piStatus, link: null , editable: false, hidden: true},
				)
			}
		);
	}

	// Final UI Data Model
	private mapToScreenUI(data: API_SINGLE_SCREEN): UI_SINGLE_SCREEN {

		const screen = new UI_SINGLE_SCREEN (
			data.screen.screenId,
			data.screen.screenName,
			data.screen.description,
			data.dealer.dealerId,
			data.dealer.businessName,
			(data.host.hostId != null) ? data.host.hostId : '',
			(data.host.name != null) ? data.host.name : '',
			(data.template.templateId != null) ? data.template.templateId : '',
			(data.template.name != null) ? data.template.name : '',
			`${data.createdBy.firstName} ${data.createdBy.lastName}`,
			'',
			this.mapToScreenZoneUI(data.screenZonePlaylistsContents),
			this.mapToScreenLicenseUI(this.licenses_array)
		);

		if(data.screen.screenTypeId != null) screen.type = data.screen.screenTypeId;
		if (data.host.notes && data.host.notes.trim().length > 0) screen.notes = data.host.notes;
		return screen;
	}

	// Screen Zone Map to UI
	private mapToScreenZoneUI(data: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[]) {
		return data.map(
			(s: API_SCREEN_ZONE_PLAYLISTS_CONTENTS) => {
				return new UI_SCREEN_ZONE_PLAYLIST(
					this.mapToZonePlaylistUI(s.screenTemplateZonePlaylist),
					this.mapToPlaylistContentUI(s.contents)
				);
			}
		);
	}

	// Zone Properties Map to UI
	private mapToZonePlaylistUI(data: API_SCREEN_TEMPLATE_ZONE) {
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
		);
	}

	private setPageData(data: API_SINGLE_SCREEN) {
		this.licenses = data.licenses;
		this.screenZonePlaylists = data.screenZonePlaylistsContents;
		// this.currentTemplate = data.template;
		this.host = data.host;
		this.hostUrl = `/${this.currentRole}/hosts/${this.host.hostId}`;
		this.sortLicenses('desc');

		//sort screen zone template by order
		data.screenZonePlaylistsContents = data.screenZonePlaylistsContents.sort((a,b)=>a.screenTemplateZonePlaylist.order - b.screenTemplateZonePlaylist.order);
		this.screen = this.mapToScreenUI(data);

		this.edit_screen_zone_playlist = data.screenZonePlaylistsContents.map(
			(i: API_SCREEN_ZONE_PLAYLISTS_CONTENTS) => {
				return new EDIT_SCREEN_ZONE_PLAYLIST(
					i.screenTemplateZonePlaylist.templateZoneId,
					i.screenTemplateZonePlaylist.playlistId
				);
			}
		);
		
		this.getPlaylistByDealer(this.screen.assigned_dealer_id);
		this.getHostByDealer(1);

		this.getTemplates().add(() => this.currentTemplate = this.templates.filter(data => data.template.templateId === this.screen.assigned_template_id)[0]);
		
		// Form Screen Information
		this.screen_info = this._form.group(
			{
				screen_title: [this.screen.screen_title, Validators.required],
				description: [this.screen.description],
				type: [{ value: this.screen.type ? this.screen.type : null, disabled: this.is_dealer ? true : false}],
				published_by: [{ value: this.screen.created_by, disabled: true }, Validators.required],
				business_name: [{ value: this.screen.assigned_dealer, disabled: true }, Validators.required],
				assigned_host: [{value: this.screen.assigned_host, disabled: true}, Validators.required],
				template: [{ value: this.screen.assigned_template, disabled: true}, Validators.required],
				notes: [{ value: this.screen.notes ? this.screen.notes : '', disabled: true }]
			}
		);

		setTimeout(() => {
			this.watchScreenInfo();	
		}, 50);
	}

	private sortLicenses(order: string): void {
		this.licenses_array = [];

		const licenses = [...this.licenses];

		if (order === 'desc') {
			this.licenses_array = licenses.sort((a, b) => b.piStatus - a.piStatus);
			return;
		}

		this.licenses_array = licenses.sort((a, b) => a.piStatus - b.piStatus);

	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentRole() {
		return this._auth.current_role;
	}
}
