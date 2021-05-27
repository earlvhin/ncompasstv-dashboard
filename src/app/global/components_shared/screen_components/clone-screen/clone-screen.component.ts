import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { API_HOST } from 'src/app/global/models/api_host.model';
import { API_SCREENTYPE } from 'src/app/global/models/api_screentype.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { HostService } from '../../../services/host-service/host.service';
import { ScreenService } from  '../../../services/screen-service/screen.service';
import { SCREEN_INFO, API_NEW_SCREEN, SCREEN_ZONE_PLAYLIST } from 'src/app/global/models/api_new-screen.model';
import { UI_SINGLE_SCREEN, UI_SCREEN_ZONE_PLAYLIST } from '../../../../global/models/ui_single-screen.model';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';

@Component({
	selector: 'app-clone-screen',
	templateUrl: './clone-screen.component.html',
	styleUrls: ['./clone-screen.component.scss']
})

export class CloneScreenComponent implements OnInit {

	all_dealers: API_DEALER[];
	clone_screen_form: FormGroup;
	clone_success = false;
	dealers_data: any[] = [];
	dealer_name: string;
	hosts: API_HOST[] = [];
	initial_load = false;
	is_dealer = false;
	form_submitted = false;
	form_valid = true;
	hosts_data: any[] = [];
	loading_data = true;
	loading_data_host = true;
	loading_search = false;
	loading_search_host = false;
	no_dealer = true;
	no_dealer_selected = true;
	no_host_available = false;
	no_host_selected = true;
	paging: any;
	paging_host: any;
	screen_types: API_SCREENTYPE[] = [];
	selected_dealer: API_DEALER[];
	selected_host: API_HOST[];
	screen_type: API_SCREENTYPE;

	form_fields_view = [
		{
			label: 'Screen New Title',
			control: 'screen_title',
			placeholder: 'Ex: Department Store Screen',
			type: 'text'
		},
		{
			label: 'Screen New Description',
			control: 'screen_description',
			placeholder: 'Ex: This screen is for the Department Store',
			type: 'text'
		}
	];

	private cloned_screen_id: string;
	private dealer_id: string;
	private is_search: boolean = false;
	private role: string;
	private search_host_data = '';
	private subscription: Subscription = new Subscription;

	constructor(
		@Inject(MAT_DIALOG_DATA) public screen_data: UI_SINGLE_SCREEN,
		private _auth: AuthService,
		private _dealer: DealerService,
		private _dialog_ref: MatDialogRef<CloneScreenComponent>,
		private _form: FormBuilder,
		private _host: HostService,
		private _router: Router,
		private _screen: ScreenService,
	) { }

	ngOnInit() {
		this.getDealers(1);
		this.getScreenTypes();
		this.initializeForm();
		this.checkIfDealer(); // auto-fill if dealer
		this.subscribeToCloneScreenFormChanges();
	}

	cloneScreen(): void {
		this.form_submitted = true;
		let screenTypeId = this.screen_type.screenTypeId;
		if (!this.is_dealer) screenTypeId = this.f.type.value;

		const screen = new API_NEW_SCREEN (
			new SCREEN_INFO (
				this.f.screen_title.value,
				this.f.screen_description.value,
				this.f.dealer_id.value,
				this.f.host_id.value,
				this.screen_data.assigned_template_id,
				this._auth.current_user_value.user_id,
				screenTypeId
			),
			this.zonePlaylist_mapToUI(),
			[]
		);

		this.form_submitted = false;

		this.subscription.add(
			this._screen.create_screen(screen).subscribe(
				(data: any) => {
					this.form_submitted = false;
					this.clone_success = true;
					this.cloned_screen_id = data.screenId;
				},
				error => {
					console.log('Error creating cloned screen', error);
				}
			)
		);
	}
	
	dealerSelected(id: any): void {
		this.f.dealer_id.setValue(id);
		this.no_dealer_selected = false;
		this.selected_dealer = this.selectedDealer(id) || id;
		this.getHostByDealer(1);
	}

	deselectDealer(): void {
		this.no_host_available = false;
		this.f.dealer_id.reset();
		this.f.host_id.reset();
		this.no_dealer_selected = true;
		this.no_host_selected = true;
		this.no_dealer = true;
		this.getDealers(1);
	}

	deselectHost(): void {
		this.f.host_id.reset();
		this.no_host_selected = true;
	}

	getDealers(page: number): void {
		this.loading_data = true;

		if (page > 1) {

			this.subscription.add(
				this._dealer.get_dealers_with_page(page, '')
					.subscribe(
						data => {
							data.dealers.map (dealer => this.all_dealers.push(dealer));
							this.paging = data.paging;
							this.loading_data = false;
						},
						error => console.log('Error retrieving dealers', error)
					)
				);

		} else {

			if (this.is_search) this.loading_search = true;

			this.subscription.add(
				this._dealer.get_dealers_with_page(page, '')
					.subscribe(
						data => {
							this.all_dealers = data.dealers;
							this.dealers_data = data.dealers;
							this.paging = data.paging;
							this.loading_data = false;
							this.loading_search = false;
						},
						error => console.log('Error searching for dealers ', error)
					)
			);
		}
	}

	hostSearchBoxTrigger(event: { is_search: boolean, page: number }): void {
		this.is_search = event.is_search;
		if(this.is_search) this.search_host_data = '';
		this.getHostByDealer(event.page);
	}

	hostSelected(id: string): void {
		this.no_host_selected = false;
		this.f.host_id.setValue(id);
		this.selected_host = this.selectedHost(id);
	}

	redirectToClonedScreen(): void {
		this._dialog_ref.close();
		this.role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this._router.navigate([`/${this.role}/screens/`, this.cloned_screen_id]);
	}

	searchBoxTrigger(event: { is_search: boolean, page: number }): void {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	searchData(event: string | number): void {
		this.loading_search = true;

		this.subscription.add(
			this._dealer.get_search_dealer(event).subscribe(
				data => {

					if (data.paging.entities.length > 0) {
						this.all_dealers = data.paging.entities;
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

	searchHostData(event: string): void {
		this.search_host_data = event;
		this.getHostByDealer(1);
	}

	
	selectedDealer(id: string): API_DEALER[] | void {

		if (!this.is_dealer) {
			return this.all_dealers.filter(dealer => dealer.dealerId == id);
		}

	}

	selectedHost(id: string): API_HOST[] {
		return this.hosts.filter(host => host.hostId == id);
	}

	setScreenType(event: any): void {
		this.f.type.setValue(event);
	}

	private get f() {
		return this.clone_screen_form.controls;
	}

	private checkIfDealer(): void {
		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.setToDealer(this.dealer_id);
		}

		// add control to type if user logged in is not a dealer
		if (!this.is_dealer) {
			this.clone_screen_form.addControl('type', new FormControl('', Validators.required));
		}
	}

	private getHostByDealer(page: number): void {

		this.loading_data_host = true;

		if (page > 1) {

			this.subscription.add(
				this._host.get_host_by_dealer_id(this.selected_dealer[0].dealerId, page, this.search_host_data)
					.subscribe(
						(data: { hosts: any[], paging: number }) => {

							data.hosts.map (
								host => {
									this.hosts.push(host.host);
									this.hosts_data.push(host.host);
								}
							);
							
							this.paging_host = data.paging;
							this.loading_data_host = false;
						},
						error => console.log('Error retrieving hosts by dealer', error)
					)
			);

		} else {

			this.hosts_data = [];
			this.initial_load = false;
			
			if (this.is_search || this.search_host_data != '') this.loading_search_host = true;

			this.subscription.add(
				this._host.get_host_by_dealer_id(this.selected_dealer[0].dealerId || this.selected_dealer, page, this.search_host_data)
					.subscribe(
						data => {

							if (!data.message) {

								if (this.search_host_data == '') {

									data.hosts.map (
										host => {
											this.hosts.push(host.host);
											this.hosts_data.push(host.host);
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
								this.selected_host = [];
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

	private getScreenTypes(): void {

		const screenTypeId = this.screen_data.type;

		this.subscription.add(
			this._screen.get_screens_type().subscribe(
				(data: API_SCREENTYPE[]) => {
					this.screen_types = data;
					this.screen_type = data.filter(type => type.screenTypeId === screenTypeId)[0];
				},
				error => console.log('Error retrieving screen types', error)
			)
		);

	}

	private initializeForm(): void {
		this.clone_screen_form = this._form.group(
			{
				screen_title: ['', Validators.required],
				screen_description: ['', Validators.required],
				dealer_id: ['', Validators.required],
				host_id: ['', Validators.required],
			}
		);
	}

	private setToDealer(e: any): void {

		if (e) {
			this.dealerSelected(e);
			this.f.dealer_id.setValue(e);
		}

	}

	private subscribeToCloneScreenFormChanges(): void {
		this.subscription.add(
			this.clone_screen_form.valueChanges.subscribe(
				() => {
					if (this.clone_screen_form.valid) this.form_valid = false; 
					else this.form_valid = true;
				}
			)
		);
	}

	private zonePlaylist_mapToUI(): SCREEN_ZONE_PLAYLIST[] {
		return this.screen_data.screen_zone_playlist.map(
			(z: UI_SCREEN_ZONE_PLAYLIST) => {
				return new SCREEN_ZONE_PLAYLIST(
					z.screen_template.template_id,
					z.screen_template.zone_id,
					z.screen_template.playlist_id
				);
			}
		);
	}

}
