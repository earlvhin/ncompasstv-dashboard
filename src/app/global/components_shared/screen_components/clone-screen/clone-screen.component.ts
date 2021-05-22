import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AuthService } from '../../../services/auth-service/auth.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { HostService } from '../../../services/host-service/host.service';
import { ScreenService } from  '../../../services/screen-service/screen.service';
import { UI_SINGLE_SCREEN, UI_SCREEN_ZONE_PLAYLIST, UI_SCREEN_LICENSE } from '../../../../global/models/ui_single-screen.model';
import { SCREEN_INFO, API_NEW_SCREEN, SCREEN_ZONE_PLAYLIST, SCREEN_LICENSE } from 'src/app/global/models/api_new-screen.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { API_HOST } from 'src/app/global/models/api_host.model';
import { API_SINGLE_SCREEN } from 'src/app/global/models/api_single-screen.model';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models/ui_role-definition.model';

@Component({
	selector: 'app-clone-screen',
	templateUrl: './clone-screen.component.html',
	styleUrls: ['./clone-screen.component.scss']
})

export class CloneScreenComponent implements OnInit {

	clone_screen_form: FormGroup;
	cloned_screen_id; string;
	clone_success: boolean = false;
	dealers$: Observable<any>;
	all_dealers: API_DEALER[];
	dealers_data: Array<any> = [];
	no_dealer_selected: boolean = true;
	no_host_selected: boolean = true;
	hosts: API_HOST[] = [];
	form_valid: boolean = true;
	no_dealer: boolean = true;
	no_host_available: boolean = false;
	screen_types: Array<any> = [];
	selected_dealer: API_DEALER[];
	selected_host: API_HOST[];
	subscription: Subscription = new Subscription;
	form_submitted: boolean = false;
	is_dealer: boolean = false;
	dealer_id: string;
	dealer_name: string;
	paging: any;
	loading_data: boolean = true;
	role: string;
	loading_search: boolean = false;
	is_search: boolean = false;

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
	]

	paging_host: any;
	hosts_data: Array<any> = [];
	search_host_data: string = "";
	loading_data_host: boolean = true;
	initial_load: boolean = false;
	loading_search_host: boolean = false;

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _host: HostService,
		private _form: FormBuilder,
		private _screen: ScreenService,
		private _router: Router,
		private _dialog_ref: MatDialogRef<CloneScreenComponent>,
		@Inject(MAT_DIALOG_DATA) public screen_data: UI_SINGLE_SCREEN
	) { }

	ngOnInit() {
		this.getDealers(1);
		this.getScreenType();
		this.clone_screen_form = this._form.group(
			{
				screen_title: ['', Validators.required],
				screen_description: ['', Validators.required],
				dealer_id: ['', Validators.required],
				host_id: ['', Validators.required],
				type: ['', Validators.required],
			}
		)
		
		this.subscription.add(
			this.clone_screen_form.valueChanges.subscribe(
				data => {
					if (this.clone_screen_form.valid) {
						this.form_valid = false;
					} else {
						this.form_valid = true;
					}
				}
			)
		)

		// for dealer_users auto fill
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.setToDealer(this.dealer_id);
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

	searchData(e) {
		this.loading_search = true;
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe(
				data => {
					console.log("DATA", data)
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
		)
	}

	getDealers(e) {
		this.loading_data = true;
		if(e > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						data.dealers.map (
							i => {
								this.all_dealers.push(i)
							}
						)
						this.paging = data.paging;
						this.loading_data = false;
					}
				)
			)
		} else {
			if(this.is_search) {
				this.loading_search = true;
			}
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						this.all_dealers = data.dealers;
						this.dealers_data = data.dealers;
						this.paging = data.paging;
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			)
		}
	}

	searchBoxTrigger (event) {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	setToDealer(e) {
		if (e) {
			this.dealerSelected(e);
			this.f.dealer_id.setValue(e);
		}
	}
	
	setScreenType(e) {
		if (e) {
			this.f.type.setValue(e);
		}
	}
	
	get f() {
		return this.clone_screen_form.controls;
	}

	cloneScreen(e) {
		console.log("E",e)
		console.log("F",this.f)
		this.form_submitted = true;
		const screen = new API_NEW_SCREEN (
			new SCREEN_INFO (
				this.f.screen_title.value,
				this.f.screen_description.value,
				this.f.dealer_id.value,
				this.f.host_id.value,
				this.screen_data.assigned_template_id,
				this._auth.current_user_value.user_id,
				this.f.type.value,
			),
			this.zonePlaylist_mapToUI(),
			[]
		)

		//console.log('Structured New Screen', screen);
		this.subscription.add(
			this._screen.create_screen(screen).subscribe(
				(data: any) => {
					//console.log(data);
					this.form_submitted = false;
					this.clone_success = true;
					this.cloned_screen_id = data.screenId;
				},
				error => {
					console.log(error);
				}
			)
		)
	}


	redirectToClonedScreen() {
		this._dialog_ref.close();
		this.role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this._router.navigate([`/${this.role}/screens/`, this.cloned_screen_id]);
	}

	zonePlaylist_mapToUI() {
		return this.screen_data.screen_zone_playlist.map(
			(z: UI_SCREEN_ZONE_PLAYLIST) => {
				return new SCREEN_ZONE_PLAYLIST(
					z.screen_template.template_id,
					z.screen_template.zone_id,
					z.screen_template.playlist_id
				)
			}
		)
	}

	screenLicense_mapToUI() {
		return this.screen_data.screen_license.map(
			(l: UI_SCREEN_LICENSE) => {
				return new SCREEN_LICENSE(
					l.license_id
				)
			}
		)
	}

	dealerSelected(id) {
		//console.log(id)
		this.f.dealer_id.setValue(id);
		this.no_dealer_selected = false;
		
		this.selected_dealer = this.selectedDealer(id) || id;
		this.getHostByDealer(1);
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

	getHostByDealer(e) {
		this.loading_data_host = true;
		if(e > 1) {
			this.subscription.add(
				this._host.get_host_by_dealer_id(this.selected_dealer[0].dealerId, e, this.search_host_data).subscribe(
					data => {
						console.log("#getHostByDealer1", data)
						console.log(data);
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
			)
		} else {
			this.hosts_data = [];
			this.initial_load = false;
			if(this.is_search || this.search_host_data != "") {
				this.loading_search_host = true;
			}
			this.subscription.add(
				this._host.get_host_by_dealer_id(this.selected_dealer[0].dealerId || this.selected_dealer, e, this.search_host_data).subscribe(
					data => {
						console.log("#getHostByDealer2", data)
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

	selectedDealer(id) {
		if(!this.is_dealer) {
			console.log("THIS", this.all_dealers)
			return this.all_dealers.filter(dealer => dealer.dealerId == id);
		}
	}

	deselectDealer() {
		this.no_host_available = false;
		this.f.dealer_id.reset();
		this.f.host_id.reset();
		this.no_dealer_selected = true;
		this.no_host_selected = true;
		this.no_dealer = true;
		this.getDealers(1);
	}

	hostSelected(id) {
		this.no_host_selected = false;
		this.f.host_id.setValue(id);
		this.selected_host = this.selectedHost(id);
	}

	selectedHost(id) {
		return this.hosts.filter(host => host.hostId == id);
	}

	deselectHost() {
		this.f.host_id.reset();
		this.no_host_selected = true;
	}
}
