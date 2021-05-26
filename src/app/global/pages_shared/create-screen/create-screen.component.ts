import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, Subscription } from 'rxjs';

import { API_TEMPLATE } from '../../models/api_template.model';
import { API_HOST } from '../../models/api_host.model';
import { API_ZONE } from '../../models/api_zone.model';
import { API_DEALER } from '../../models/api_dealer.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { EditableFieldModalComponent } from '../../components_shared/page_components/editable-field-modal/editable-field-modal.component';
import { HostService } from '../../services/host-service/host.service';
import { LicenseService } from '../../services/license-service/license.service';
import { PlaylistService } from '../../services/playlist-service/playlist.service';
import { ScreenCreatedModalComponent } from '../../components_shared/screen_components/screen-created-modal/screen-created-modal.component';
import { ScreenService } from '../../services/screen-service/screen.service';
import { TemplateService } from '../../services/template-service/template.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';

@Component({
	selector: 'app-create-screen',
	templateUrl: './create-screen.component.html',
	styleUrls: ['./create-screen.component.scss']
})

export class CreateScreenComponent implements OnInit {

	subscription: Subscription = new Subscription;

	assigned_licenses: Array<any> = [];
	dealer$: Observable<API_DEALER[]>;
	host$: Observable<API_HOST[]>;
	license$: Observable<any>;
	playlist: any;
	template$: Observable<API_TEMPLATE[]>;
	templates$: Observable<API_TEMPLATE[]>;

	creating_screen: boolean = false;
	dealers: any;
	dealerid: string;
	dealer_name: string;
	is_dealer: boolean = false;
	hosts: API_HOST[] = [];
	hostid: string;
	is_dealer_present: any;
	is_host_present: any;
	new_screen_form: FormGroup;
	screen_params: any;
	screen_info_error = true;
	no_chosen_template: boolean = true;
	selected_template_id: string;
	selected_template_zones: Array<any>;
	slide_toggle_status = [];
	title: string = "Create Screen";
	zone_playlist_form: FormGroup;
	zone: string;
	paging: any;
	loading_data: boolean = true;

	dealers_data: Array<any> = [];
	screen_types: Array<any> = [];
	loading_search: boolean = false;
	is_search: boolean = false;
	reset_screen: boolean = false;
	loading_playlist = true;
	no_playlist_data = false;

	new_screen_form_view = [
		{
			label: 'Screen Name *',
			control: 'screen_name',
			width: 'col-lg-12',
			placeholder: 'Ex: This Screen Name'
		},
		{
			label: 'Description',
			control: 'description',
			width: 'col-lg-12',
			placeholder: 'Ex: Describe this Screen'
		}
	]

	paging_host: any;
	hosts_data: Array<any> = [];
	search_host_data: string = "";
	search_dealer_data = '';
	loading_data_host: boolean = true;
	initial_load: boolean = false;
	loading_search_host: boolean = false;
	screen_selected: string = null;

	licenses: any;
	private queued_install_dates: { licenseId: string, installDate: string }[] = [];

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _host: HostService,
		private _license: LicenseService,
		private _param: ActivatedRoute,
		private _playlist: PlaylistService,
		private _router: Router,
		private _screen: ScreenService,
		private _template: TemplateService,
	) { }

	ngOnInit() {
		this.new_screen_form = this._form.group(
			{
				screen_name: ['', Validators.required],
				description: [''],
			}
		)

		this.zone_playlist_form = this._form.group(
			{
				screenZonePlaylist: this._form.array([])
			}
		)

		this.subscription.add(
			this._param.queryParamMap.subscribe(
				data => {
					if (data.get('dealer_id') && data.get('host_id')) {
						this.dealerid = data.get('dealer_id');
						this.hostid = data.get('host_id');
						this.getDealerById(this.dealerid);
						this.getPlaylistsByDealerId(this.dealerid);
						this.getHostsByDealerId(1);
						this.getHostById(this.hostid);
						this.getLicenseByHostId(this.hostid);
					}
				}
			)
		)

		this.subscription.add(
			this.new_screen_form.valueChanges.subscribe(
				f => {
					if ((this.dealerid != undefined && this.new_screen_form.valid) && (this.screen_selected != undefined && this.new_screen_form.valid)) {
						this.screen_info_error = false;
					}
				}
			)
		)

		this.getScreenType();
		this.getDealers(1);
		this.getTemplates();

		// for dealer_users auto fill
		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.dealerid = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.setToDealer(this.dealerid);
		}
	}

	ngDestroy() {
		this.subscription.unsubscribe();
	}

	// Convenience getter for easy access to form fields
	get i() { return this.new_screen_form.controls; }
	get p() { return this.zone_playlist_form.controls; }

	addPlaylistButton() {
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this._router.navigate([`/${route}/playlists/create-playlist`]);
	}

	addHostButton() {
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this._router.navigate([`/${route}/create-host`]);
	}

	checkIfStep1Complete() {
		if ((this.dealerid != undefined && this.new_screen_form.valid) && (this.screen_selected != undefined && this.new_screen_form.valid)) {
			this.screen_info_error = false;
		} else {
			this.screen_info_error = true;
		}
	}

	getScreenType() {
		this.subscription.add(
			this._screen.get_screens_type().subscribe(
				data => {
					this.screen_types = data;
					console.log("Screen Type", data)
				}
			)
		)
	}

	setScreenType(type): void {
		this.screen_selected = type;
		this.reset_screen = false;
	}

	clearScreenType(): void {
		this.screen_selected = null;
		this.reset_screen = true;
	}

	getDealers(page: number): void {
		this.loading_data = true;

		if (page > 1) {

			this.subscription.add(
				this._dealer.get_dealers_with_page(page, '').subscribe(
					data => {
						data.dealers.map(dealer => this.dealers.push(dealer));
						this.paging = data.paging;
						this.loading_data = false;
					},
					error => {
						console.log('Error retrieving dealer data', error);
						this.loading_data = false;
					}
				)
			);

		} else {

			if (this.is_search || this.search_dealer_data != '') {
				this.loading_search = true;
			}

			this.subscription.add(
				this._dealer.get_dealers_with_page(page, '').subscribe(
					data => {
						this.dealers = data.dealers;
						this.paging = data.paging;
						this.loading_data = false;
						this.dealers_data = data.dealers;
						this.loading_search = false;
					}, 
					error => {
						console.log('Error searching for dealers', error);
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			);
		}
	}

	searchBoxTrigger(event): void {
		this.is_search = event.is_search;
		this.getDealers(event.page);	
	}

	getDealerById(id): void {

		this.subscription.add(
			this._dealer.get_dealer_by_id(id).subscribe(
				(data: API_DEALER) => {
					this.is_dealer_present = { id: data.dealerId, name: data.businessName }
				}
			)
		);
	}

	getHostsByDealerId(e): void {
		this.loading_data_host = true;

		if (e > 1) {
			this.subscription.add(
				this._host.get_host_by_dealer_id(this.dealerid, e, this.search_host_data).subscribe(
					data => {
						data.hosts.map (
							i => {
								this.hosts.push(i.host);
								this.hosts_data.push(i.host);
							}
						)
						this.paging_host = data.paging;
						this.loading_data_host = false;
					}
				)
			);
		} else {

			this.hosts_data = [];
			this.initial_load = false;

			if (this.is_search || this.search_host_data != "") {
				this.loading_search_host = true;
			}

			this.subscription.add(
				this._host.get_host_by_dealer_id(this.dealerid, e, this.search_host_data).subscribe(
					data => {
						if(!data.message) {
							if(this.search_host_data == "") {
								data.hosts.map (
									i => {
										this.hosts.push(i.host);
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
							this.hostid = "";
							if(this.search_host_data != "") {
								this.hosts_data = [];
								this.loading_search = false;
							}
						}
						this.loading_data_host = false;
						this.loading_search_host = false;
					}
				)
			);
		}
	}

	getHostById(id) {
		this.subscription.add(
			this._host.get_host_by_id(id).subscribe(
				(data: any) => {
					this.is_host_present = {
						id: data.host.dealerId,
						name: data.host.name
					}
				}
			)
		);
	}

	getLicenseByHostId(id): void {
		this.license$ = this._license.get_license_by_host_id(id);

		const get = this.license$.subscribe(
			response => {
				get.unsubscribe();
				this.licenses = response;
			},
			error => console.log('Error retrieving licenses', error)
		);
	}

	getPlaylistsByDealerId(id): void {
		this.loading_playlist = true;
		this.no_playlist_data = false;

		this.subscription.add(
			this._playlist.get_playlist_by_dealer_id(id).subscribe(
				(data: any) => {
					this.playlist = data;
					this.loading_playlist = false;
					if (this.playlist.length <= 0) this.no_playlist_data = true;
				},
				error => {
					console.log('Error retrieving dealer playlists', error);
					this.loading_playlist = false;
					this.no_playlist_data = true;
				}
			)
		);
	}

	getTemplates() {
		this.templates$ = this._template.get_templates();
	}

	getTemplateById(id): void {
		this.no_chosen_template = false;
		this.selected_template_id = id;

		this.zone_playlist_form = this._form.group(
			{
				screenZonePlaylist: this._form.array([])
			}
		);

		this.selected_template_zones = [];
		this.template$ = this._template.get_template_by_id(id);

		this.subscription.add(
			this.template$.subscribe(
				(data: API_TEMPLATE[]) => {
					data.forEach(t => {
						t.templateZones.forEach(z => {
							this.selected_template_zones.push(z);
							this.zonePlaylistForm(z);
						})
					});
				}
			)
		);
	}

	dealerSearchBoxTrigger(event): void {
		this.is_search = event.is_search;
		if (this.is_search) this.search_dealer_data = '';
		this.getDealers(event.page);
	}

	hostSearchBoxTrigger(event): void {
		this.is_search = event.is_search;
		if (this.is_search) this.search_host_data = '';
		this.getHostsByDealerId(event.page);
	}

	searchHostData(e): void {
		this.search_host_data = e;
		this.getHostsByDealerId(1);
	}

	searchDealerData(keyword: string): void {
		this.search_dealer_data = keyword;
		this.getDealers(1);
	}

	licenseSelected(status: boolean, licenseId: string, index: number): void {

		if (status) {
			this.assigned_licenses.push(licenseId);
			return;
		}
		
		const assignedIndex = this.assigned_licenses.indexOf(licenseId);
		const queuedIndex = this.queued_install_dates.findIndex(license => license.licenseId === licenseId);

		this.assigned_licenses.splice(assignedIndex, 1);
		this.queued_install_dates.splice(queuedIndex, 1);
		this.licenses[index].installDate = null;
		
	}

	onBulkSetInstallDate(): void {
		this.onSetInstallDate('', '', null, true);
	}

	onSetInstallDate(licenseId: string, installDate: string, index = null, multiple = false): void {

		if (!this.assigned_licenses.includes(licenseId) && !multiple) return;

		const label = !multiple ? 'Install Date' : 'Bulk Install Date';
		const message = label;
		const width = '350px';
		const dialogParams: any = { width, data: { status: { label, dropdown_edit: false }, message, data: installDate } };
		const dialog = this._dialog.open(EditableFieldModalComponent, dialogParams);

		const close = dialog.afterClosed().subscribe(
			date => {
				close.unsubscribe();
				
				if (!date || typeof date === 'undefined' || date.trim().length <= 0) return;

				const queued = this.queued_install_dates;
				const queuedLicenseIds = queued.map(license => license.licenseId);

				if (multiple) {
					const selected = this.assigned_licenses;

					selected.forEach(
						id => {

							let data = { licenseId: id, installDate: date };
							const idNotQueued = !queuedLicenseIds.includes(id);

							if (idNotQueued) this.queued_install_dates.push(data);

							const index = this.licenses.findIndex(license => license.licenseId === id && idNotQueued);

							if (index !== -1) this.licenses[index].installDate = date;

						}
					);

					return;
				}

				const data = { licenseId, installDate: date };

				if (queuedLicenseIds.includes(licenseId)) {
					const indexToReplace = this.queued_install_dates.findIndex(date => date.licenseId === licenseId);
					this.queued_install_dates[indexToReplace] = data;
				} else {
					this.queued_install_dates.push(data);
				}

				this.licenses[index].installDate = date;

			},
			error => console.log('Error closing install date dialog ', error)
		);

	}

	openConfirmationModal(): void {
		let dialog = this._dialog.open(ScreenCreatedModalComponent, {
			disableClose: true,
			width: '600px',
			data: this.i.screen_name.value
		});

		this.subscription.add(
			dialog.afterClosed().subscribe(
				() => {
					const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
					this._router.navigate([`/${route}/screens`]);
				}
			)
		);
	}

	publishScreen(): void {
		let screen_licenses = [];
		let zone_playlist_data_trim = [];
		const zone_playlist_data = this.zone_playlist_form.get('screenZonePlaylist').value;
		this.creating_screen = true;

		zone_playlist_data.forEach(data => {

			const zone_playlist = {
				templateId: data.templateId,
				templateZoneId: data.templateZoneId,
				playlistId: data.zonePlaylist
			};

			zone_playlist_data_trim.push(zone_playlist);
		});

		this.assigned_licenses.forEach(l => {
			const license = { licenseId: l }
			screen_licenses.push(license);
		});

		// Structuring data to be sent
		const created_screen = {
			screen: {
				screenName:  this.i.screen_name.value,
				description: this.i.description.value,
				screenTypeId: this.screen_selected,
				dealerid: this.dealerid,
				hostid: this.hostid,
				templateid: this.selected_template_id,
				createdby: 	this._auth.current_user_value.user_id
			},
			screenZonePlaylists:zone_playlist_data_trim,
			licenses: screen_licenses
		};

		if (this.creating_screen) {

			// if install dates are set
			if (this.queued_install_dates.length > 0) {
				const publish = {
					screen: this._screen.create_screen(created_screen),
					install_dates: this._license.update_install_date_list(this.queued_install_dates)
				};
	
				this.subscription.add(forkJoin([ publish.screen, publish.install_dates ]).subscribe(
					() => {
						this.openConfirmationModal();
						this.creating_screen = false;
					},
					error => console.log('Error publishing screen/installing dates', error)
				));

				return;
			}

			this.subscription.add(
				this._screen.create_screen(created_screen).subscribe(
					() => {
						this.openConfirmationModal();
						this.creating_screen = false;
					},
					error => console.log('Error publishing screen', error)
				)
			);

		}
	}

	searchData(e): void {
		this.loading_search = true;

		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe(
				data => {
					if (data.paging.entities.length > 0) {
						this.dealers = data.paging.entities;
						this.dealers_data = data.paging.entities;
						this.loading_search = false;
					} else {
						this.dealers_data = [];
						this.loading_search = false;
					}
					this.paging = data.paging;
				}
			)
		);
	}
	
	setToDealer(dealer): void {
		this.dealerid = dealer;
		this.getPlaylistsByDealerId(dealer);
		this.getHostsByDealerId(1);
	}

	setToHost(host): void {
		this.hostid = host;
		this.getLicenseByHostId(host);
	}

	zonePlaylistForm(z): void {
		const zonesPlaylistForms = this.zone_playlist_form.get('screenZonePlaylist') as FormArray;
		zonesPlaylistForms.push(this.zonePlaylist(z));
	}

	zonePlaylist(zone: API_ZONE): FormGroup {
		return new FormGroup(
			{
				'templateName': new FormControl(zone.name),
				'templateId': new FormControl(this.selected_template_id),
				'templateZoneId': new FormControl(zone.templateZoneId),
				'zonePlaylist': new FormControl()
			}
		)
	}
}
