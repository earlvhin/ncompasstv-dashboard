import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { API_CREATE_FEED } from '../../../../global/models/api_feed.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { FeedService } from '../../../../global/services/feed-service/feed.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';

@Component({
	selector: 'app-create-feed',
	templateUrl: './create-feed.component.html',
	styleUrls: ['./create-feed.component.scss']
})
export class CreateFeedComponent implements OnInit {
	create_feed_fields = [
		{
			label: 'Feed Title *',
			control: 'feedTitle',
			placeholder: 'Ex: ESPN News',
			type: 'text',
			width: 'col-lg-12'
		},
		{
			label: 'Feed Description (Optional)',
			control: 'feedDescription',
			placeholder: 'Ex: ESPN Latest News Today',
			type: 'text',
			width: 'col-lg-12'
		},
		{
			label: 'Assign To (Optional)',
			control: 'assignTo',
			placeholder: 'Type in a Dealer Business Name',
			type: 'text',
			width: 'col-lg-12',
			is_autocomplete: true
		},
		{
			label: 'Feed URL *',
			control: 'feedUrl',
			placeholder: 'Feed URL',
			type: 'text',
			width: 'col-lg-12'
		},
		{
			label: 'Feed Type *',
			control: 'feedType',
			placeholder: 'Feed Type',
			type: 'option',
			width: 'col-lg-12'
		}
	];
	dealer_id: string;
	dealer_name: string;
	dealer_not_found: boolean;
	dealers: API_DEALER[];
	dealers_data: Array<any> = [];
	disable_btn: boolean = true;
	filtered_options: Observable<any[]>;
	is_dealer: boolean = false;
	is_loading: boolean = true;
	is_search: boolean = false;
	list = [
		{
			name: 'News',
			id: 'news',
			checked: true
		},
		{
			name: 'Weather',
			id: 'weather',
			checked: false
		},
		{
			name: 'Filler',
			id: 'filler',
			checked: false
		},
		{
			name: 'Live Stream',
			id: 'live_stream',
			checked: false
		}
	];
	loading_data: boolean = true;
	loading_search: boolean = false;
	new_feed_form: FormGroup;
	paging: any;
	selected_dealer: string;
	subscription: Subscription = new Subscription();
	@Output() reload_page = new EventEmitter();

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<CreateFeedComponent>,
		private _feed: FeedService,
		private _form: FormBuilder
	) {}

	ngOnInit() {
		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.setDealerId(this.dealer_id);
		}

		this.getDealers(1);
	}

	createFeedForm() {
		const reg =
			/^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
		this.new_feed_form = this._form.group({
			feedTitle: ['', Validators.required],
			feedDescription: [''],
			feedUrl: ['', Validators.required],
			assignTo: [''],
			feedType: this.list[0].id
		});

		this.subscription.add(
			this.new_feed_form.valueChanges.subscribe((data: any) => {
				if (this.new_feed_form.valid) {
					this.disable_btn = false;
				} else {
					this.disable_btn = true;
				}
			})
		);
		this.matAutoComplete();
	}

	get f() {
		return this.new_feed_form.controls;
	}

	searchData(e) {
		this.loading_search = true;
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe((data) => {
				if (data.paging.entities.length > 0) {
					this.dealers = data.paging.entities;
					this.dealers_data = data.paging.entities;
					this.loading_search = false;
				} else {
					this.dealers_data = [];
					this.loading_search = false;
				}
				this.paging = data.paging;
			})
		);
	}

	getDealers(e) {
		this.loading_data = true;
		if (e > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
					data.dealers.map((i) => {
						this.dealers.push(i);
					});
					this.paging = data.paging;
					this.loading_data = false;
				})
			);
		} else {
			if (this.is_search) {
				this.loading_search = true;
			}

			this.subscription.add(
				this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
					this.dealers = data.dealers;
					this.dealers_data = data.dealers;
					this.paging = data.paging;
					this.createFeedForm();
					this.is_loading = false;
					this.loading_data = false;
					this.loading_search = false;
				})
			);
		}
	}

	searchBoxTrigger(event) {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	changeType(e) {
		this.f.feedType.setValue(e.value);
	}

	saveFeed() {
		this.is_loading = true;

		const new_feed = new API_CREATE_FEED(
			this.f.feedTitle.value,
			this.f.feedDescription.value,
			this.f.feedUrl.value,
			this.selected_dealer || null,
			this._auth.current_user_value.user_id,
			this.f.feedType.value
		);

		this.subscription.add(
			this._feed.create_feed([new_feed]).subscribe(
				(data) => {
					this._dialog_ref.close(data);
					this.reload_page.emit(true);
					this.confirmationModal('success', 'Feed Saved Successfully', 'Click OK to continue');
				},
				(error) => {
					this.confirmationModal('error', 'Error while saving feed', error.error.message);
				}
			)
		);
	}

	confirmationModal(status, message, data) {
		this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		});
	}

	// Autocomplete beyond this point
	matAutoComplete() {
		this.filtered_options = this.f.assignTo.valueChanges.pipe(
			startWith(''),
			map((value) => this._filter(value))
		);
	}

	private _filter(value): any {
		const filterValue = value.toLowerCase();
		const returnValue = this.dealers.filter((d) => d.businessName.toLowerCase().indexOf(filterValue) === 0);

		// If a dealer was selected and the user cleared/changed the autocomplete
		// field, this will determine if the current value on the field exists
		// on the dealer array.
		if (returnValue.length == 0) {
			this.dealer_not_found = true;
			this.selected_dealer = undefined;
		}

		return returnValue;
	}

	// Set field to value of selected option from autocomplete field
	setDealerId(e) {
		if (e) {
			this.selected_dealer = e;
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
}
