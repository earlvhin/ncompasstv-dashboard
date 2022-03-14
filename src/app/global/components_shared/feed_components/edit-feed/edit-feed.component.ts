import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { FeedService } from 'src/app/global/services/feed-service/feed.service';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { CreateFeedComponent } from '../create-feed/create-feed.component';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';

@Component({
	selector: 'app-edit-feed',
	templateUrl: './edit-feed.component.html',
	styleUrls: ['./edit-feed.component.scss']
})

export class EditFeedComponent implements OnInit {

	create_feed_fields = [
		{
			label: 'Feed Title *',
			control: 'feedTitle',
			placeholder: 'Ex: ESPN News',
			type: 'text',
			width: 'col-lg-12'
		},{
			label: 'Feed Description (Optional)',
			control: 'feedDescription',
			placeholder: 'Ex: ESPN Latest News Today',
			type: 'text',
			width: 'col-lg-12'
		},{
			label: 'Assign To (Optional)',
			control: 'assignTo',
			placeholder: 'Type in a Dealer Business Name',
			type: 'text',
			width: 'col-lg-12',
			is_autocomplete: true
		},{
			label: 'Feed URL *',
			control: 'feedUrl',
			placeholder: 'Feed URL',
			type: 'text',
			width: 'col-lg-12'
		},{
			label: 'Feed Type *',
			control: 'classification',
			placeholder: 'Feed Type',
			type: 'option',
			width: 'col-lg-12'
		}
	]
	dealer_id: string;
	dealer_name: string;
	dealer_not_found: boolean;
	dealers: API_DEALER[];
	dealers_data: Array<any> = [];
	disable_btn: boolean = true;
	edit_feed_form:  FormGroup;
	filtered_options: Observable<any[]>;
	is_dealer: boolean = false;
	is_loading: boolean = true;
	is_search: boolean = false;
	list = [
		{ 
			name: "News", 
			id: "news",
			checked: true,
		},{ 
			name: "Weather", 
			id: "weather",
			checked: false,
		},{ 
			name: "Filler", 
			id: "filler",
			checked: false,
		}
	]
	loading_data: boolean = true;
	loading_search: boolean = false;
	paging: any;
	selected_dealer: string;
	subscription: Subscription = new Subscription();
	
	constructor(
		private _dealer: DealerService,
		private _form: FormBuilder,
		private _feed: FeedService,
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<CreateFeedComponent>,
		private _router: Router,
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any
	) { }

	ngOnInit() {
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.createFeedForm(true);
		} else {
			this.dealer_id = this._dialog_data.business_name.id;
			this.dealer_name = this._dialog_data.business_name.value;
			this.getDealers(1);
		}
	}
	
	getDealers(e) {
		this.loading_data = true;
		if(e > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						data.dealers.map(
							i => {
								this.dealers.push(i)
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
						this.dealers = data.dealers;
						this.dealers_data = data.dealers;
						this.paging = data.paging
						this.is_loading = false;
						this.loading_data = false;
						this.loading_search = false;
						this.createFeedForm();
					}
				)
			)
		}
	}

	searchData(e) {
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
		)
	}

	searchBoxTrigger (event) {
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator) {
			this.is_search = event.is_search;
			this.getDealers(event.page);		
		}
	}

	changeType(e) {
		this.f.classification.setValue(e.value);
	}


	createFeedForm(dealer?) {
		console.log("DIALOG", this._dialog_data)
		const reg = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
		this.edit_feed_form = this._form.group(
			{
				contentId: [this._dialog_data.id ? this._dialog_data.id.value : null, Validators.required],
				feedTitle: [this._dialog_data.title ? this._dialog_data.title.value : null, Validators.required],
				feedDescription: [this._dialog_data.description ? this._dialog_data.description.value: null],
				feedUrl: [this._dialog_data.feed_url ? this._dialog_data.feed_url.link : null, Validators.required],
				dealerId: [this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer ? this._auth.current_user_value.roleInfo.businessName : this._dialog_data.business_name.id, {disabled: true}],
				classification: [this._dialog_data.classification ? this._dialog_data.classification.value.toLowerCase() : null]
			}
		)

		if (dealer) {
			this.setDealerId(this.dealer_id);
			this.is_loading = false;
		}

		this.subscription.add(
			this.edit_feed_form.valueChanges.subscribe(
				(data: any) => {
					if (this.edit_feed_form.valid) {
						this.disable_btn = false;
					} else {
						this.disable_btn = true;
					}
				}
			)
		)
	}

	get f() {
		return this.edit_feed_form.controls;
	}

	// Set field to value of selected option from autocomplete field
	setDealerId(e) {
		if (e) {
			this.selected_dealer = e;
			this.f.dealerId.setValue(e);
			this.dealer_not_found = false;
		} else {
			this.dealer_not_found = true;
		}
	}

	// User typed but did not select any option from the autocomplete field
	checkSelectedDealer(e) {
		if (e.target.value && this.selected_dealer == undefined) {
			this.dealer_not_found = true;
		} else {
			this.dealer_not_found = false;
		}
	}

	saveFeed() {
		this.is_loading = true;
		this.subscription.add(
			this._feed.edit_feed(this.edit_feed_form.value).subscribe(
				data => {
					console.log('#saveFeed', data)
					this._dialog_ref.close(data);
					this.confirmationModal('success', 'Feed Saved Successfully', 'Click OK to continue')
				},
				error => {
					console.log('#saveFeed', error)
					this.confirmationModal('error', 'Error while saving feed', error.error.message)
				}
			)
		)
	} 

	confirmationModal(status, message, data) {
		let dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: status,
				message: message,
				data: data
			}
		})
	}
}
