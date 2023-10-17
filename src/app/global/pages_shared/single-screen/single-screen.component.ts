import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as io from 'socket.io-client';

import { environment } from 'src/environments/environment';
import { ScreenLicenseComponent } from 'src/app/global/components_shared/screen_components/screen-license/screen-license.component';
import { CloneScreenComponent } from 'src/app/global/components_shared/screen_components/clone-screen/clone-screen.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UnassignLicenseComponent } from 'src/app/global/components_shared/screen_components/unassign-license/unassign-license.component';
import { ChangeTemplateComponent } from 'src/app/global/components_shared/screen_components/change-template/change-template.component';

import {
	API_CONTENT,
	API_CHANGE_TEMPLATE,
	API_HOST,
	API_LICENSE,
	API_LICENSE_PROPS,
	API_PLAYLIST,
	API_SCREEN_TEMPLATE_ZONE,
	API_SCREENTYPE,
	API_SCREEN_ZONE_PLAYLISTS_CONTENTS,
	API_SINGLE_SCREEN,
	API_TEMPLATE,
	EDIT_SCREEN_ZONE_PLAYLIST,
	EDIT_SCREEN_INFO,
	PAGING,
	SCREEN_LICENSE,
	UI_CONTENT,
	UI_ROLE_DEFINITION,
	UI_SINGLE_SCREEN,
	UI_SCREEN_LICENSE_SCREENS,
	UI_SCREEN_ZONE_PLAYLIST,
	UI_ZONE_PLAYLIST
} from 'src/app/global/models';

import { AuthService, HelperService, HostService, LicenseService, PlaylistService, ScreenService, TemplateService } from 'src/app/global/services';
import { API_ZONE } from '../../models/api_zone.model';

@Component({
	selector: 'app-single-screen',
	templateUrl: './single-screen.component.html',
	styleUrls: ['./single-screen.component.scss']
})
export class SingleScreenComponent implements OnInit {
	dealer_playlist: API_PLAYLIST[] = [];
	dealer_hosts: API_HOST[] = [];
	edit_screen_info: EDIT_SCREEN_INFO;
	edit_screen_zone_playlist: EDIT_SCREEN_ZONE_PLAYLIST[];
	host: API_SINGLE_SCREEN['host'];
	hostUrl: string;
	initial_load = false;
	is_dealer = false;
	is_initial_load_for_dealer = true;
	is_search = false;
	is_view_only = false;
	licenses_array: API_LICENSE_PROPS[];
	licenses: API_LICENSE['license'][];
	license_tbl_row_url: string;
	license_tbl_row_slug: string = 'license_id';
	loading_data_host = true;
	loading_search = false;
	loading_search_host = false;
	no_case = true;
	no_changes = true;
	paging_data: PAGING;
	paging_host: PAGING;
	playlist_id: string;
	playlist_route: string;
	playlist_contents: UI_CONTENT[];
	screen: UI_SINGLE_SCREEN;
	screen_init: string;
	screen_licenses: SCREEN_LICENSE[] = [];
	screen_types: API_SCREENTYPE[] = [];
	search_host_data: string = '';
	searching = false;
	screen_id: string;
	screen_info: FormGroup;
	screen_zone_playlist_contents: UI_SCREEN_ZONE_PLAYLIST[];
	screen_template: UI_ZONE_PLAYLIST;
	screen_zone: API_ZONE;
	templates: API_TEMPLATE[];

	private currentTemplate: API_TEMPLATE;
	private hosts_data: API_HOST[] = [];
	protected _socket: any;
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
		private _router: Router,
		private _screen: ScreenService,
		private _template: TemplateService
	) {}

	license_column = ['#', 'License Key', 'Alias', 'Internet Type', 'Internet Speed'];

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
	get s() {
		return this.screen_info.controls;
	}

	ngOnInit() {
		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
			query: 'client=Dashboard__SingleScreenComponent'
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
		this.license_tbl_row_url = `/${this.roleRoute}/licenses/`;
		this.playlist_route = `/${this.roleRoute}/playlists/`;
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		this._socket.disconnect();
	}

	// Had to change this.screen type to ANY due to extra fields that are non existent in the UI_SINGLE_SCREEN type
	activateLicense(id: string) {
		this._license
			.activate_license(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					const license = this.screen.screen_license.filter((i) => i.license_key.value === id)[0];

					this._socket.emit('D_activated', license.license_id.value);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	cloneScreen() {
		const dialog = this._dialog.open(CloneScreenComponent, {
			minWidth: '500px',
			minHeight: '500px',
			data: this.screen,
			panelClass: 'no-overflow'
		});

		dialog.afterClosed().subscribe(async (response: boolean) => {
			if (!response) return;

			await this._router.navigate([`/${this.roleRoute}/screens/`, this._helper.singleScreenData.screen.screenId]);
			this.setPageData(this._helper.singleScreenData);
			this.getScreenLicenses(1);
			this.getScreenType();
		});
	}

	deactivateLicense(id: string) {
		this._license
			.deactivate_license(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => (error) => {
				console.error(error);
			});
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
		});

		delete_dialog.afterClosed().subscribe((result) => {
			if (result == 'delete') {
				let array_to_delete = [];
				array_to_delete.push(this.screen_id);

				this._screen
					.delete_screen(array_to_delete)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(
						() => {
							this._router.navigate([`/${this.roleRoute}/screens`]);
						},
						(error) => {
							console.error(error);
						}
					);
			}
		});
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
		);

		// Structure Data to be sent
		const final_screen_info = {
			screen: this.edit_screen_info != undefined ? this.edit_screen_info : this.screen_info.value,
			screenZonePlaylists: this.edit_screen_zone_playlist
		};

		// Send Data to API
		this._screen
			.edit_screen(final_screen_info)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.no_changes = true;
					this.openConfirmationModal('success', 'Success!', 'Screen successfully updated!');
				},
				(error) => {
					console.error(error);
				}
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

		this._license
			.get_license_by_screen_id(this.screen_id, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.searching = false;
				this.paging_data = response.paging;

				if (response.message) {
					this.screen_licenses = [];
					return;
				}

				this.screen_licenses = this.mapToScreenLicenseUI(response.paging.entities);
			});
	}

	// Get Playlist By Dealer ID
	getPlaylistByDealer(id: string | number) {
		this._playlist
			.get_playlist_by_dealer_id_v2(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { paging: PAGING; playlists: { playlists: API_PLAYLIST[]; contents: any }[] }) => {
					const { entities } = response.paging;
					const playlists = entities as API_PLAYLIST[];
					this.dealer_playlist = playlists;
				},
				(error) => {
					console.error(error);
				}
			);
	}

	// Get Host By Dealer
	getHostByDealer(page: number) {
		this.loading_data_host = true;

		if (page > 1) {
			this._host
				.get_host_by_dealer_id(this.screen.assigned_dealer_id, page, this.search_host_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						if (data && data.paging.entities) {
							data.paging.entities.map((i) => {
								this.dealer_hosts.push(i);
								this.hosts_data.push(i);
							});
							this.paging_host = data.paging;
							this.loading_data_host = false;
						}
					},
					(error) => {
						console.error(error);
					}
				);
		} else {
			this.hosts_data = [];
			this.initial_load = false;
			if (this.is_search || this.search_host_data != '') this.loading_search_host = true;

			this._host
				.get_host_by_dealer_id(this.screen.assigned_dealer_id, page, this.search_host_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						if (!data.message && data.paging.entities) {
							if (this.search_host_data == '') {
								data.paging.entities.map((i) => {
									this.dealer_hosts.push(i);
									this.hosts_data.push(i);
								});
							} else {
								if (data.paging.entities.length > 0) {
									this.hosts_data = data.paging.entities;
									this.loading_search = false;
								}
							}

							this.paging_host = data.paging;
						} else {
							this.screen.assigned_host_id = '';

							if (this.search_host_data != '') {
								this.hosts_data = [];
								this.loading_search = false;
							}
						}

						this.loading_data_host = false;
						this.loading_search_host = false;
					},
					(error) => {
						console.error(error);
					}
				);
		}
	}

	getScreenType() {
		this._screen
			.get_screens_type()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => (this.screen_types = data),
				(error) => {
					console.error(error);
				}
			);
	}

	hostSearchBoxTrigger(event: { is_search: boolean; page: number }) {
		this.is_search = event.is_search;
		if (this.is_search) this.search_host_data = '';
		this.getHostByDealer(event.page);
	}

	// Host is Selected
	hostSelected(data) {
		this.screen.assigned_host_id = data;
	}

	licenseListUpdated(type = 'assign') {
		this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'success',
				message: `License(s) sucessfully ${type}ed`,
				data: 'Press OK to continue.'
			}
		});
	}

	// Open Assign License Modal
	onAssignLicense() {
		const dialog = this._dialog.open(ScreenLicenseComponent, {
			disableClose: true,
			data: { license_id: this.screen.assigned_host_id, screen_id: this.screen.screen_id, zone_contents: this.screen.screen_zone_playlist }
		});

		dialog.afterClosed().subscribe((response) => {
			if (!response) return;
			this.getScreenLicenses(1);
			this.ngOnInit();
			this.licenseListUpdated();
		});
	}

	onChangeTemplate(): void {
		const config: MatDialogConfig = {
			height: '600px',
			minWidth: '900px',
			disableClose: true,
			data: {
				currentTemplate: this.currentTemplate,
				dealerPlaylists: this.dealer_playlist,
				playlistId: this.playlist_id,
				playlistRoute: this.playlist_route,
				screen: this.screen,
				screenZonePlaylists: this.screen.screen_zone_playlist,
				templates: this.templates.filter((data) => data.template.templateId !== this.currentTemplate.template.templateId)
			}
		};

		const dialog: MatDialogRef<ChangeTemplateComponent> = this._dialog.open(ChangeTemplateComponent, config);

		dialog.afterClosed().subscribe(
			(response: boolean | API_CHANGE_TEMPLATE) => {
				if (!response) return;

				this.screen = null;

				this._screen
					.change_template(response as API_CHANGE_TEMPLATE)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(
						async (response) => {
							await this._router.navigate([`/${this.roleRoute}/screens/`, response.screenId]);
							const screenData = (await this._screen.get_screen_by_id(response.screenId).toPromise()) as API_SINGLE_SCREEN;
							this.screen_id = screenData.screen.screenId;
							this.setPageData(screenData);
							this.checkMissingZones(screenData.screen.templateId);
							this.getScreenLicenses(1);
							this.getScreenType();
						},
						(error) => {
							console.error(error);
						}
					);
			},
			(error) => {
				console.error(error);
			}
		);
	}

	onUnassignLicense() {
		const dialog = this._dialog.open(UnassignLicenseComponent, {
			disableClose: true,
			data: { licenses: this.licenses, screen_id: this.screen.screen_id }
		});

		dialog.afterClosed().subscribe((response) => {
			if (!response) return;
			this.getScreenLicenses(1);
			this.ngOnInit();
			this.licenseListUpdated('unassign');
		});
	}

	openConfirmationModal(status, message, data): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialog.afterClosed().subscribe(() => this.ngOnInit());
	}

	// Playlist is selected
	playlistSelected(playlist_id: string, zone_id: string) {
		const currentZonePlaylists = Array.from(this.edit_screen_zone_playlist);
		const toChangeIndex = currentZonePlaylists.findIndex((zonePlaylist) => zonePlaylist.templateZoneId === zone_id);
		if (playlist_id === currentZonePlaylists[toChangeIndex].playlistId) return;
		currentZonePlaylists[toChangeIndex].playlistId = playlist_id;
		this.edit_screen_zone_playlist = [...currentZonePlaylists];
		this.no_changes = false;
	}

	searchHostData(keyword: string) {
		this.search_host_data = keyword;
		this.getHostByDealer(1);
	}

	// Template Selected
	templateSelected(data) {
		this.s.template.setValue(data);
	}

	toggleActivateDeactivate(event: { id: string; status: any }) {
		if (event.status) {
			this.activateLicense(event.id);
		} else {
			this.deactivateLicense(event.id);
		}
	}

	//Unassign Playlist
	unassignPlaylist(zone_id: string) {
		this.edit_screen_zone_playlist.forEach((z) => {
			if (z.templateZoneId === zone_id) {
				this.no_changes = false;
				z.playlistId = '';
			}
		});

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
		this.screen_info.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => (this.no_changes = false));
	}

	private checkMissingZones(templateId: string) {
		this._template
			.get_template_by_id(templateId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response: API_TEMPLATE[]) => {
				if (!response || response.length <= 0) return;

				const template = response[0];
				const zonesCount = template.templateZones.length;
				const currentZoneCount = this.screen.screen_zone_playlist.length;

				if (zonesCount === currentZoneCount) return;

				const onlyCurrentZoneNames = this.screen.screen_zone_playlist.map((screenZonePlaylist) =>
					screenZonePlaylist.screen_template.name.toLowerCase()
				);

				const missingZones = Array.from(template.templateZones)
					.filter((zone) => !onlyCurrentZoneNames.includes(zone.name.toLowerCase()))
					.map((zone) => {
						const screen_template = new UI_ZONE_PLAYLIST(
							this.screen.screen_id,
							templateId,
							zone.templateZoneId,
							`${zone.xPos}`,
							`${zone.yPos}`,
							`${zone.height}`,
							`${zone.width}`,
							null,
							null,
							zone.name,
							zone.description,
							zone.order
						);

						return {
							screen_template,
							contents: []
						};
					});

				const currentPlaylistZone = Array.from(this.screen.screen_zone_playlist);
				const mutatedZonePlaylsit = currentPlaylistZone.concat(missingZones);
				let mutatedScreenZonePlaylist = Array.from(this.edit_screen_zone_playlist);

				mutatedScreenZonePlaylist = mutatedScreenZonePlaylist.concat(
					missingZones.map((zone) => {
						return { templateZoneId: zone.screen_template.zone_id, playlistId: null };
					})
				);

				this.screen.screen_zone_playlist = [...mutatedZonePlaylsit];
				this.edit_screen_zone_playlist = [...mutatedScreenZonePlaylist];
			});
	}

	private getInternetType(value: string): string {
		if (!value || value.trim().length === 0) return 'N/A';
		value = value.toLowerCase();
		if (value.includes('w')) return 'WiFi';
		if (value.includes('eth')) return 'LAN';
	}

	private getScreen(id: string) {
		if (this.is_initial_load_for_dealer && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
			this.setPageData(this._helper.singleScreenData);
			this.checkMissingZones(this._helper.singleScreenData.template.templateId);
			this.is_initial_load_for_dealer = false;
			return;
		}

		this._screen
			.get_screen_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_SINGLE_SCREEN) => {
					this.setPageData(response);
					this.checkMissingZones(response.template.templateId);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private getTemplates() {
		return this._template
			.get_templates()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: API_TEMPLATE[]) => (this.templates = data),
				(error) => {
					console.error(error);
				}
			);
	}

	// Playlist Contents and Properties Map to UI
	private mapToPlaylistContentUI(data: API_CONTENT[]) {
		if (data) {
			return data.map((c: API_CONTENT) => {
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
					c.isProtected,
					c.uuid
				);
			});
		}
	}

	// Get Licenses where THIS screen is playing
	private mapToScreenLicenseUI(data: any) {
		let counter = 1;

		return data.map((l: API_LICENSE_PROPS) => {
			return new UI_SCREEN_LICENSE_SCREENS(
				{ value: l.licenseId, link: null, editable: false, hidden: true },
				{ value: counter++, link: null, editable: false, hidden: false },
				{
					value: l.licenseKey,
					link: `/${this.roleRoute}/licenses/${l.licenseId}`,
					editable: false,
					hidden: false,
					status: true,
					new_tab_link: true
				},
				{
					value: l.alias ? l.alias : '--',
					link: `/${this.roleRoute}/licenses/${l.licenseId}`,
					editable: true,
					label: 'License Alias',
					id: l.licenseId,
					hidden: false,
					new_tab_link: true
				},
				{ value: l.internetType ? this.getInternetType(l.internetType) : '--', link: null, editable: false, hidden: false },
				{ value: l.internetSpeed ? l.internetSpeed : '--', link: null, editable: false, hidden: false },
				{ value: l.isActivated, link: null, editable: false, hidden: true },
				{ value: l.isRegistered, link: null, editable: false, hidden: true },
				{ value: l.piStatus, link: null, editable: false, hidden: true },
				{ value: l.playerStatus, link: null, editable: false, hidden: true }
			);
		});
	}

	openPlaylistInNewTab(route: string, pid: string) {
		// Converts the route into a string that can be used
		// with the window.open() function
		const url = this._router.serializeUrl(this._router.createUrlTree([`${route}/${pid}`]));

		window.open(url, '_blank');
	}

	// Final UI Data Model
	private mapToScreenUI(data: API_SINGLE_SCREEN): UI_SINGLE_SCREEN {
		const screen = new UI_SINGLE_SCREEN(
			data.screen.screenId,
			data.screen.screenName,
			data.screen.description,
			data.dealer.dealerId,
			data.dealer.businessName,
			data.host.hostId != null ? data.host.hostId : '',
			data.host.name != null ? data.host.name : '',
			data.template.templateId != null ? data.template.templateId : '',
			data.template.name != null ? data.template.name : '',
			`${data.createdBy.firstName} ${data.createdBy.lastName}`,
			this.mapToScreenZoneUI(data.screenZonePlaylistsContents),
			this.mapToScreenLicenseUI(this.licenses_array)
		);

		if (data.screen.screenTypeId != null) screen.type = data.screen.screenTypeId;

		if (data.host.notes && data.host.notes.trim().length > 0) screen.notes = data.host.notes;

		return screen;
	}

	// Screen Zone Map to UI
	private mapToScreenZoneUI(data: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[]) {
		return data.map((s: API_SCREEN_ZONE_PLAYLISTS_CONTENTS) => {
			return new UI_SCREEN_ZONE_PLAYLIST(this.mapToZonePlaylistUI(s.screenTemplateZonePlaylist), this.mapToPlaylistContentUI(s.contents));
		});
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
		this.host = data.host;
		this.hostUrl = `/${this.roleRoute}/hosts/${this.host.hostId}`;
		this.sortLicenses('desc');

		//sort screen zone template by order
		data.screenZonePlaylistsContents = data.screenZonePlaylistsContents.sort(
			(a, b) => a.screenTemplateZonePlaylist.order - b.screenTemplateZonePlaylist.order
		);
		this.screen = this.mapToScreenUI(data);

		this.edit_screen_zone_playlist = data.screenZonePlaylistsContents.map((i: API_SCREEN_ZONE_PLAYLISTS_CONTENTS) => {
			return new EDIT_SCREEN_ZONE_PLAYLIST(i.screenTemplateZonePlaylist.templateZoneId, i.screenTemplateZonePlaylist.playlistId);
		});

		this.getPlaylistByDealer(this.screen.assigned_dealer_id);
		this.getHostByDealer(1);

		this.getTemplates().add(
			() => (this.currentTemplate = this.templates.filter((data) => data.template.templateId === this.screen.assigned_template_id)[0])
		);

		// Form Screen Information
		this.screen_info = this._form.group({
			screen_title: [this.screen.screen_title, Validators.required],
			description: [this.screen.description],
			type: [{ value: this.screen.type ? this.screen.type : null, disabled: this.is_dealer ? true : false }],
			published_by: [{ value: this.screen.created_by, disabled: true }, Validators.required],
			business_name: [{ value: this.screen.assigned_dealer, disabled: true }, Validators.required],
			assigned_host: [{ value: this.screen.assigned_host, disabled: true }, Validators.required],
			template: [{ value: this.screen.assigned_template, disabled: true }, Validators.required],
			notes: [{ value: this.screen.notes ? this.screen.notes : '', disabled: true }]
		});

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

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
