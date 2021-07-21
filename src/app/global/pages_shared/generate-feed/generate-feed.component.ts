import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FeedMediaComponent } from '../../components_shared/feed_components/feed-media/feed-media.component';
import { API_CONTENT } from '../../models/api_content.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { API_GENERATED_FEED, GenerateFeed } from '../../models/api_feed_generator.model'; 
import { Sortable } from 'sortablejs';
import { FeedItem } from '../../models/ui_feed_item.model';
import { FeedService } from '../../services/feed-service/feed.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';

@Component({
	selector: 'app-generate-feed',
	templateUrl: './generate-feed.component.html',
	styleUrls: ['./generate-feed.component.scss']
})

export class GenerateFeedComponent implements OnInit {
	@ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;
	
	dealer_id: string;
	editing: boolean = false;
	fetched_feed: API_GENERATED_FEED;
	feed_items: FeedItem[] = [];
	filtered_options: Observable<{dealerId: string, businessName: string}[]>;
	generated_feed: GenerateFeed;
	is_dealer: boolean = false;
	new_feed_form: FormGroup;
	saving: boolean = false;
	selected_dealer: string;
	selected_index: number = 0;
	title: string = "Generate Feed";
	route: string;

	dealers: {
		dealerId: string,
		businessName: string
	}[];

	apply_to_all_btn_status: boolean = false;

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _feed: FeedService,
		private _form: FormBuilder,
		private _dialog: MatDialog,
		private _router: Router,
		private _route: ActivatedRoute
	) { 
		this.getParamOfActivatedRoute();
	}

	ngOnInit() {
		this.route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);

		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];
	
		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.selected_dealer = this._auth.current_user_value.roleInfo.dealerId;
		} else {
			if (!this.editing) {
				this.getDealers();	
			}
		}
	}

	/** Enable Edit Mode if an ID is passed on init */
	private getParamOfActivatedRoute() {
		this._route.paramMap.subscribe(
			(data: any) => {
				if (data.params.data) {
					this.editing = true;
					this.title = 'Edit Generated Feed';
					this.getGeneratedFeedById(data.params.data);
				}
			}
		)
	}

	/** Get feed info of passed query param
	 *  @param {string} data ID from URL
	 */
	private getGeneratedFeedById(id: string) {
		this._feed.get_generated_feed_by_id(id).subscribe(
			(data: API_GENERATED_FEED) => {
				this.fetched_feed = data;
				this.mapFetchedGeneratedFeedToUI(this.fetched_feed);
				this.prepareFeedInfoForm();
			}
		)
	}

	/** Initialize Angular Material Autocomplete Component */
	private matAutoFilter(): void {
		this.filtered_options = this.f.assign_to.valueChanges.pipe(
			startWith(''),
			map(value => this.filter(value))
		)
	}

	/**
	 * Filter Method for the Angular Material Autocomplete
	 * @param {string} value The entered phrase in the field
	 * @returns {dealerId: string, businessName: string} Array of filtered results
 	 */
	private filter(value: string): {dealerId: string, businessName: string}[] {
		const filter_value = value.toLowerCase();
		const filtered_result = this.dealers.filter(i => i.businessName.toLowerCase().includes(filter_value));
		this.selected_dealer = filtered_result[0] && value ? filtered_result[0].dealerId : null;
		return filtered_result;
	}

	/** Get all dealers to display on the auto-complete field. For admin only */
	private getDealers(): void {
		this._dealer.export_dealers().subscribe(
			(data: any) => {
				this.dealers = data;
				this.prepareFeedInfoForm();
				this.matAutoFilter();
			}, 
			error => console.log(error)
		)
	}

	/** Build Feed Information Form with fields of feed_title, description, assign_to */
	private prepareFeedInfoForm(): void {
		if (this.editing) {
			this.new_feed_form = this._form.group(
				{
					feed_title: [this.fetched_feed.feeds.feedTitle, Validators.required],
					description: [this.fetched_feed.feeds.description],
					assign_to: [{
						value: this.fetched_feed.feeds.businessName,
						disabled: true
					}, Validators.required],
				}
			)

			this.selected_dealer = this.fetched_feed.feeds.dealerId;
		} else {
			this.new_feed_form = this._form.group(
				{
					feed_title: [this.editing ? this.fetched_feed.feeds.feedTitle : '', Validators.required],
					description: [this.editing ? this.fetched_feed.feeds.description : '',],
					assign_to: [{
						value: this.is_dealer ? this._auth.current_user_value.roleInfo.businessName : '',
						disabled: this.is_dealer ? true : false
					}, Validators.required],
				}
			)
		}
	}

	/** New Feed Form Control Getter */
	private get f() {
		return this.new_feed_form.controls;
	}

	/**
	 * Structure the Feed Items Sequence
	 * @param {API_CONTENT[]} data The Feed Items
	 */
	private structureFeedItems(data: API_CONTENT[]): void {
		data.forEach(
			(f: API_CONTENT) => {
				this.feed_items.push(
					new FeedItem(
						{
							heading: 'Click Here To Change Heading',
							duration: 5,
							paragraph: ''
						},
						{
							content_id: f.contentId,
							filename: f.title,
							filetype: f.fileType,
							preview_url: f.previewThumbnail,
							file_url: `${f.url}${f.fileName}`
						}
					)
				)
			}
		);
	}

	/** Sortable JS Plugin Initialization*/
	private sortableJSInit(): void {
		const set = (sortable) => {
			let sorted_feed_items = [];
			
			sortable.toArray().forEach(i => {
				this.feed_items.forEach(f => {
					if (i == f.image.content_id) {
						sorted_feed_items.push(f)
					}
				})
			})
			
			sorted_feed_items;
			this.feed_items = sorted_feed_items;
		}
		
		if (this.draggables) {
			new Sortable(this.draggables.nativeElement, {
				swapThreshold: 1,
				sort: true,
				animation: 500,
				ghostClass: 'dragging',
				scrollSensitivity: 200,
				multiDrag: true,
				selectedClass: 'selected',
				fallbackOnBody: true,
				forceFallback: true,
				group: 'feed_content_items',
				fallbackTolerance: 10,
				store: { set }
			});
		}
	}

	/**
	 * Structure Feed Contents with GenerateFeed.feedContents Type
	 * @param {feedItem[]} data Array of feed content items
	 * @returns Structured Array of Feed Contents with GenerateFeed.feedContents Type
	 */
	private structureFeedContents(data: FeedItem[]): {contentId: string, heading: string, paragraph: string, duration: number, sequence: number}[] {
		let feed_contents = [];

		data.map((feed, index) => {
			feed_contents.push(
				{
					contentId: feed.image.content_id,
					heading: feed.context.heading,
					paragraph: feed.context.paragraph,
					duration: feed.context.duration,
					sequence: index += 1
				}
			)
		})

		return feed_contents;
	}

	/**
	 * Map fetched generated feed by id to UI to prepare for editing
	 * 
	 */
	private mapFetchedGeneratedFeedToUI(data: API_GENERATED_FEED) {
		data.feedContents.map(
			c => {
				this.feed_items.push(
					new FeedItem(
						{
							heading: c.heading,
							duration: c.duration,
							paragraph: c.paragraph
						},
						{
							content_id: c.contentId,
							filename: '',
							filetype: '',
							preview_url: '',
							file_url: ''
						}
					)
				)
			}
		)
	}

	/** Apply Set Duration a Field to All Items
	 *  @param {number} duration Duration set from UI
	 */
	applyDurationToAll(duration: number) {
		this.feed_items.forEach(
			i => {
				i.context.duration = duration || 5;
			}
		)

		this.apply_to_all_btn_status = !this.apply_to_all_btn_status;
	}

	/** Construct Generated Feed Payload to be sent to API */
	structureFeedToGenerate(): void {
		this.generated_feed = new GenerateFeed(
			{
				dealerId: this.selected_dealer,
				feedTitle: this.f.feed_title.value,
				description: this.f.description.value,
				createdBy: this._auth.current_user_value.user_id
			},
			this.structureFeedContents(this.feed_items)
		)
	}

	/** POST Request to API with Generated Feed Payload*/
	saveGeneratedFeed(): void {
		this.saving = true;

		this._feed.generate_feed(this.generated_feed).subscribe(
			data => {
				console.log(data);
				this._router.navigate([`/${this.route}/feeds`])
			},
			error => {
				console.log(error);
			}
		)
	}

	/** Open Media Library where contents are assigned to selected dealer */
	openMediaLibraryModal(): void {
		let dialog = this._dialog.open(FeedMediaComponent, {
			width: '1024px',
			data: this.selected_dealer
		})

		dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
			if (data && data.length > 0) {
				this.structureFeedItems(data);
				this.sortableJSInit();
			}
		})
	}

	/**
	 * On Angular Material Selection Change Event
	 * @param e Selection Change Event Object
	 */
	selectionChange(e): void {
		this.selected_index = e.selectedIndex;
	}
}