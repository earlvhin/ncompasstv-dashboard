import { EventEmitter, HostListener, Output } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription  } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { API_FEED_TYPES, API_GENERATED_FEED, GenerateSlideFeed } from 'src/app/global/models';
import { AuthService, FeedService } from 'src/app/global/services';

@Component({
	selector: 'app-feed-info',
	templateUrl: './feed-info.component.html',
	styleUrls: ['./feed-info.component.scss']
})

export class FeedInfoComponent implements OnInit {

	@Input() dealers: { dealerId: string, businessName: string }[];
	@Input() editing: boolean = false;
	@Input() fetched_feed: API_GENERATED_FEED;
	@Input() feed_types: API_FEED_TYPES[];
	@Input() is_dealer: boolean = false;
	@Output() feed_info = new EventEmitter();
	@Output() formChanges: EventEmitter<boolean> = new EventEmitter<boolean>();

	existing: any;
	filtered_options: Observable<{dealerId: string, businessName: string}[]>;
	generated_feed: GenerateSlideFeed;
	hasUnsavedChanges: boolean = false;
	isDealer = this._auth.current_role === 'dealer' || this._auth.current_role === 'sub-dealer';
	new_feed_form: FormGroup;
	selected_dealer: string;
	private formSubscription: Subscription;

	constructor(
		private _auth: AuthService,
		private _form: FormBuilder,
		private _feed: FeedService
	) { }

	ngOnInit() {
		this.prepareFeedInfoForm();

		this.formSubscription = this.new_feed_form.valueChanges.subscribe((f) => {
			this.hasUnsavedChanges =  f.feed_title || f. feed_type || f.description || f.assign_to !== "" && !this.isDealer;
			this.formChanges.emit(this.hasUnsavedChanges);
			this.updateHasUnsavedChanges(this.hasUnsavedChanges)
		})

	}

	ngOnDestroy() {
		window.removeEventListener('beforeunload', this.unloadNotification);
		this.formSubscription.unsubscribe();
	}

	@HostListener('window:beforeunload', ['$event'])
	unloadNotification($event: any): void {
		if (this.hasUnsavedChanges) {
			$event.returnValue = true;
		}
	}

	updateHasUnsavedChanges(value: boolean) {
		this._feed.setInputChanges(value);
	  }

	/** Structure Feed Information and Pass */
	structureFeedInfo() {
		if (!this.editing) {
			this.feed_info.emit(this.new_feed_form.value)
		} else {
			/** Temp workaround (For some reason assign_to_id field value is not reflecting ) */
			this.feed_info.emit({
				feed_title: this.new_feed_form.controls.feed_title.value,
				description: this.new_feed_form.controls.description.value,
				feed_type: this.fetched_feed.feedType.feedTypeId,
				assign_to_id: this.fetched_feed.dealerId
			});
		}
	}

	/**
	 * Filter Method for the Angular Material Autocomplete
	 * @param {string} value The entered phrase in the field
	 * @returns {dealerId: string, businessName: string} Array of filtered results
 	 */
	private filter(value: string): {dealerId: string, businessName: string}[] {
		const filter_value = value.toLowerCase();
		const filtered_result = this.dealers ? this.dealers.filter(i => i.businessName.toLowerCase().includes(filter_value)) : [];

		if (!this.is_dealer) {
			this.selected_dealer = filtered_result[0] && value ? filtered_result[0].dealerId : null;
			this.new_feed_form.controls.assign_to_id.setValue(this.selected_dealer);
		}

		return filtered_result;
	}

	/** Build Feed Information Form with fields of feed_title, description, assign_to */
	private prepareFeedInfoForm(): void {

		let config: { [ key: string ]: any };
		const feed = this.fetched_feed;

		config = {
			feed_title: [ '', Validators.required ],
			description: [ '' ],
			feed_type: [ '', Validators.required ],
			assign_to: [ this.is_dealer ? this.dealers[0].businessName : '' ],
			assign_to_id: [ this.is_dealer ? this.dealers[0].dealerId : '' ]
		};

		if (this.editing) {

			config['feed_title'] = [ feed.feedTitle, Validators.required ];
			config['description'] = [ feed.description ];
			config['feed_type'] = [ { value: feed.feedType.feedTypeId, disabled: true },  Validators.required ];
			config['assign_to'] = [ { value: null, disabled: true } ];
			config['assign_to_id'] = [ { value: null, disabled: true } ];

			if (feed.dealerId) {
				config['assign_to'] = [ { value: feed.dealer.businessName, disabled: true } ];
				config['assign_to_id'] = [ { value: this.dealers.filter(dealer => dealer.dealerId === feed.dealerId), disabled: true } ];
			}

		}

		this.new_feed_form = this._form.group(config);
		this.matAutoFilter();
	}

	/** Initialize Angular Material Autocomplete Component */
	private matAutoFilter(): void {
		this.filtered_options = this.new_feed_form.controls.assign_to.valueChanges
			.pipe(
				startWith(''),
				map(value => this.filter(value))
			);
	}

}