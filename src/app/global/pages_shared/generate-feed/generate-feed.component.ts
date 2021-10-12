import { Component, Input, OnInit} from '@angular/core';
import { Observable, forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth-service/auth.service';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { 
	API_GENERATED_FEED, 
	SLIDE_GLOBAL_SETTINGS, 
	WEATHER_FEED_STYLE_DATA, 
	GenerateSlideFeed, 
	GenerateWeatherFeed, 
	NEWS_FEED_STYLE_DATA, 
	GenerateNewsFeed,
	FEED_FILLER_SETTINGS,
	FEED_FILLERS,
	GenerateFillerFeed
} from '../../models/api_feed_generator.model'; 
import { FeedItem } from '../../models/ui_feed_item.model';
import { FeedService } from '../../services/feed-service/feed.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { API_FEED_TYPES } from '../../models/api_feed.model';

@Component({
	selector: 'app-generate-feed',
	templateUrl: './generate-feed.component.html',
	styleUrls: ['./generate-feed.component.scss']
})

export class GenerateFeedComponent implements OnInit {
	@Input() background_image: string;
	@Input() banner_image: string;
	subscription: Subscription = new Subscription();
	
	dealer_id: string;
	editing: boolean = false;
	feed_info: any;
	feed_types: API_FEED_TYPES[];
	fetched_feed: API_GENERATED_FEED;
	feed_items: FeedItem[] = [];
	filtered_options: Observable<{dealerId: string, businessName: string}[]>;
	generated_slide_feed: GenerateSlideFeed;
	generated_news_feed: GenerateNewsFeed;
	generated_weather_feed: GenerateWeatherFeed;
	generated_filler_feed: GenerateFillerFeed;
	is_dealer: boolean = false;
	
	saving: boolean = false;
	selected_banner_image: string;
	selected_dealer: string;
	selected_index: number = 0;
	slide_global_settings: SLIDE_GLOBAL_SETTINGS;
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
		private _router: Router,
		private _route: ActivatedRoute
	) { }

	ngOnInit(): void {
		this.route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);

		this.getParamOfActivatedRoute();

		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];
	
		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.selected_dealer = this._auth.current_user_value.roleInfo.dealerId;
		}
	}

	ngOnDestroy(): void {
		this.subscription.unsubscribe();
	}

	/**
	 * Structure Feed Contents with GenerateSlideFeed.feedContents Type
	 * @param {feedItem[]} data Array of feed content items
	 * @returns Structured Array of Feed Contents with GenerateSlideFeed.feedContents Type
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

	/** Enable Edit Mode if an ID is passed on init */
	private getParamOfActivatedRoute() {
		this._route.paramMap.subscribe(
			(data: any) => {
				if (data.params.data) {
					this.editing = true;
					this.title = 'Edit Generated Feed';
					this.getGeneratedFeedById(data.params.data);
				} else {
					if (!this.is_dealer) {
						this.getSelectFieldData();	
					}
				}
			}
		)
	}

	/** ForkJoin: API Call on Dealers and Feed Type to supply data on Dealer and Feed Type Select Fields */
	private getSelectFieldData() {
		const observables = [ this._dealer.export_dealers(), this._feed.get_feed_types() ];
		this.subscription.add(
			forkJoin(observables).subscribe(
				([dealers, feedTypes]) => {
					this.feed_types = feedTypes;

					if (this.is_dealer) {
						this.dealers = dealers.filter(d => d.dealerId === this.selected_dealer)
					} else {
						this.dealers = dealers;
					}
				},
				error => console.log('Error Getting Dealers and FeedTypes', error)
			)
		)
	}

	/** Get feed info of passed query param
	 *  @param {string} data ID from URL
	 */
	private getGeneratedFeedById(id: string) {
		this.subscription.add(
			this._feed.get_generated_feed_by_id(id).subscribe(
				(data: API_GENERATED_FEED) => {
					this.fetched_feed = data;
					this.selected_dealer = data.dealerId;

					console.log(data);

					/** Please improve this future dev, maybe use enums? :) */
					if (data.feedType.name === 'Slide Feed') {
						this.mapFetchedGeneratedFeedToUI(this.fetched_feed);
					}
				}
			)
		)
	}

	/** Map fetched generated feed by id to UI to prepare for editing
	 * @param data {API_GENERATED_FEED}
	 */
	private mapFetchedGeneratedFeedToUI(data: API_GENERATED_FEED) {
		this.slide_global_settings = data.slideGlobalSettings;
		data.feedSlides.map(
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
							filename: c.contents.title,
							filetype: c.contents.fileType,
							preview_url: `https://cdn.filestackcontent.com/resize=width:500/${c.contents.handlerId}`,
							file_url: `${c.contents.url}${c.contents.fileName}`
						}
					)
				)
			}
		)
	}

	/** Prepare Feed Info */
	prepareFeedInfo(e: {feed_title: string, description: string, feed_type: string, assign_to: string, assign_to_id: string}) {
		this.selected_dealer = e.assign_to_id;

		this.feed_info = {
			dealerId: this.selected_dealer,
			feedTitle: e.feed_title,
			description: e.description,
			createdBy: this._auth.current_user_value.user_id,
			feedId: this.editing ? this.fetched_feed.feedId : null,
			feedTypeId: e.feed_type,
			updatedBy: this.editing ? this._auth.current_user_value.user_id : null
		}
	}

	/** Construct Generated Slide Feed Payload to be sent to API */
	structureSlideFeedToGenerate(feed_data: { globalSettings: any, feedItems: any, selectedBannerImage: string, imageAnimation: number}): void {
		feed_data.globalSettings.imageAnimation = feed_data.imageAnimation;

		this.generated_slide_feed = new GenerateSlideFeed(
			this.feed_info,
			feed_data.globalSettings,
			this.structureFeedContents(feed_data.feedItems)
		)

		console.log('GENFEED', this.generated_slide_feed);

		this.selected_banner_image = feed_data.selectedBannerImage;
	}

	/** Construct Generated News Feed Payload to be sent to API */
	structureNewsFeedToGenerate(feed_data: NEWS_FEED_STYLE_DATA): void {
		this.generated_news_feed = new GenerateNewsFeed(
			this.feed_info,
			feed_data
		)
	}

	/** Construct Generated Weather Feed Payload to be sent to API */
	structureWeatherFeedToGenerate(feed_data: WEATHER_FEED_STYLE_DATA): void {
		this.generated_weather_feed = new GenerateWeatherFeed(
			this.feed_info,
			feed_data
		)
	}
	
	/** Construct Generated Weather Feed Payload to be sent to API */
	structureFillerFeedToGenerate(
	feed_data: { 
		feedFillerSettings: FEED_FILLER_SETTINGS, 
		feedFillers: FEED_FILLERS[]	
	}): void {
		this.generated_filler_feed = new GenerateFillerFeed(
			this.feed_info,
			feed_data.feedFillerSettings,
			feed_data.feedFillers
		)

		console.log(this.generated_filler_feed);
	}
	
	/** Set Selected Feed */
	setSelectedFeedType(feedTypeId: string) {
		if (!this.editing) return this.feed_types.filter(i => i.feedTypeId === feedTypeId)[0].name;
		return this.fetched_feed.feedType.name;
	}

	/** POST Request to API with Generated Slide Feed Payload*/
	saveGeneratedSlideFeed(): void {
		this.saving = true;

		if (!this.editing) {
			this.subscription.add(
				this._feed.generate_feed(this.generated_slide_feed, 'slides').subscribe(
					data => {
						console.log(data);
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		} else {
			this.subscription.add(
				this._feed.update_slide_feed(this.generated_slide_feed).subscribe(
					data => {
						console.log(data);
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		}
	}

	/** POST Request to API with Generated Weather Feed Payload*/
	saveGeneratedWeatherFeed(): void {
		this.saving = true;

		if (!this.editing) {
			this.subscription.add(
				this._feed.generate_feed(this.generated_weather_feed, 'weather').subscribe(
					data => {
						console.log(data);
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		} else {
			this.subscription.add(
				this._feed.update_weather_feed(this.generated_weather_feed).subscribe(
					data => {
						console.log(data);
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		}
	}

	/** POST Request to API with Generated News Feather Feed Payload*/
	saveGeneratedNewsFeed(): void {
		this.saving = true;

		if (!this.editing) {
			this.subscription.add(
				this._feed.generate_feed(this.generated_news_feed, 'news').subscribe(
					data => {
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		} else {
			this.subscription.add(
				this._feed.update_news_feed(this.generated_news_feed).subscribe(
					data => {
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		}
	}

	/** POST Request to API with Generated News Feather Feed Payload*/
	saveGeneratedFillerFeed(): void {
		this.saving = true;

		if (!this.editing) {
			this.subscription.add(
				this._feed.generate_feed(this.generated_filler_feed, 'fillers').subscribe(
					data => {
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		} else {
			this.subscription.add(
				this._feed.update_filler_feed(this.generated_filler_feed).subscribe(
					data => {
						this._router.navigate([`/${this.route}/feeds`])
					},
					error => {
						console.log(error);
					}
				)
			)
		}
	}

	/**
	 * On Angular Material Selection Change Event
	 * @param e Selection Change Event Object
	 */
	selectionChange(e): void {
		this.selected_index = e.selectedIndex;
	}
}