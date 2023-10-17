import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';

import {
	API_CONTENT,
	UI_TABLE_ADVERTISERS_CONTENT,
	UI_ROLE_DEFINITION_TEXT,
	API_ADVERTISER,
	API_DEALER,
	UI_ACTIVITY_LOGS,
	API_USER_DATA
} from 'src/app/global/models';
import { AdvertiserService, ContentService, HelperService, DealerService, UserService } from 'src/app/global/services';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Component({
	selector: 'app-single-advertiser',
	templateUrl: './single-advertiser.component.html',
	styleUrls: ['./single-advertiser.component.scss'],
	providers: [DatePipe]
})
export class SingleAdvertiserComponent implements OnInit, OnDestroy {
	activity_data: UI_ACTIVITY_LOGS[] = [];
	advertiser_data: any;
	advertiser_id: string;
	advertiser: API_ADVERTISER;
	advertiserAndDealer: { advertiser: API_ADVERTISER; dealer: API_DEALER } = null;
	array_to_preview: API_CONTENT[] = [];
	content_data: any = [];
	contents_loaded = false;
	created_by: any;
	createdBy: string;
	current_role = this._auth.current_role;
	current_user = this._auth.current_user_value;
	currentImage = 'assets/media-files/admin-icon.png';
	dateCreated: any;
	dateFormatted: any;
	dealer: API_DEALER;
	description: string;
	has_only_view_permission = this._auth.current_user_value.roleInfo.permission === 'V';
	initial_load_activity = true;
	is_banner_data_ready = false;
	no_activity_data = false;
	page: any;
	paging_data_activity: any;
	reload_data: boolean = false;
	selected_index: number;
	sort_column_activity = 'DateCreated';
	sort_order_activity = 'desc';
	table_columns = ['#', 'Name', 'Type', 'Upload Date', 'Uploaded By'];
	user: API_USER_DATA;

	private is_loading = false;
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _date: DatePipe,
		private _dealer: DealerService,
		private _helper: HelperService,
		private _params: ActivatedRoute,
		private _content: ContentService,
		private _user: UserService
	) {}

	ngOnInit() {
		this._params.paramMap.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			this.advertiser_id = this._params.snapshot.params.data;
			this.getAdvertiser();
			this.getContents();
		});

		this.getAdvertiserActivity(1);

		this._params.queryParams.pipe(takeUntil(this._unsubscribe)).subscribe((data) => (this.selected_index = data.tab));
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getActivityColumnsAndOrder(data: { column: string; order: string }): void {
		this.sort_column_activity = data.column;
		this.sort_order_activity = data.order;
		this.getAdvertiserActivity(1);
	}

	getAdvertiserActivity(page: number) {
		this.activity_data = [];

		this._advertiser
			.get_advertiser_activity(this.advertiser_id, this.sort_column_activity, this.sort_order_activity, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(res) => {
					if (res.paging.entities.length === 0) {
						this.no_activity_data = true;
						this.activity_data = [];
						return;
					}

					this.getUserByIds(res.paging.entities.map((a) => a.initiatedBy)).subscribe((responses) => {
						this.created_by = responses;

						const mappedData = this.activity_mapToUI(res.paging.entities);
						this.paging_data_activity = res.paging;
						this.activity_data = [...mappedData];
						this.reload_data = true;
					});
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.initial_load_activity = false));
	}

	reload_page(e: boolean): void {
		if (e) this.ngOnInit();
	}
	getUserByIds(ids: any[]) {
		const userObservables = ids.map((id) => this._user.get_user_by_id(id).pipe(takeUntil(this._unsubscribe)));

		return forkJoin(userObservables);
	}

	activity_mapToUI(activity): any {
		let count = 1;

		return activity.map((a: any) => {
			const activityCode = a.activityCode;
			let activityMessage = 'Other Activity Detected';
			let createdBy;

			this.created_by.map((c) => {
				if (c.userId === a.initiatedBy) createdBy = c;
			});

			if (activityCode === 'modify_advertiser') activityMessage = `${createdBy.firstName} ${createdBy.lastName} modified the advertiser`;

			return new UI_ACTIVITY_LOGS(
				{ value: count++, editable: false },
				{ value: a.ownerId, hidden: true },
				{ value: a.activityLogId, hidden: true },
				{ value: this._date.transform(a.dateCreated, 'MMMM d, y'), hidden: false },
				{ value: activityMessage, hidden: false },
				{ value: a.initiatedBy, hidden: true },
				{ value: a.dateUpdated, hidden: true }
			);
		});
	}

	private async getAdvertiser() {
		let dealer: API_DEALER;

		if (this.is_loading && (this.current_role === 'dealer' || this.current_role === 'sub-dealer')) {
			this.advertiser = this._helper.singleAdvertiserData;
			this.setDescription();

			try {
				dealer = await this._dealer.get_dealer_by_id(this.advertiser.dealerId).toPromise();
			} catch (error) {
				console.error(error);
			}

			this.is_loading = false;
			this.is_banner_data_ready = true;
			return;
		}

		this._advertiser
			.get_advertiser_by_id(this.advertiser_id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				async (response) => {
					const { advertiser, tags } = response;
					advertiser.tags = tags;
					this.advertiser = advertiser;
					this.setDescription();
					this.getUser(response.advertiser.createdBy);
					this.dateCreated = response.advertiser.dateCreated;

					try {
						dealer = await this._dealer.get_dealer_by_id(advertiser.dealerId).toPromise();
					} catch (error) {
						console.error(error);
					}

					this.advertiserAndDealer = { advertiser, dealer };
					if (response.advertiser.logo) this.currentImage = response.advertiser.logo;
					this.is_banner_data_ready = true;
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.is_loading = false));
	}

	private getContents(): void {
		this._content
			.get_content_by_advertiser_id(this.advertiser_id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT[] | { message: string }) => {
					this.content_data = response;

					if (!Array.isArray(response)) return;

					const data = response as API_CONTENT[];
					this.array_to_preview = response;
					this.content_data = [...this.mapContentsToTableUI(data)];
					this.contents_loaded = true;
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.contents_loaded = true));
	}

	getUser(id: any) {
		this._user
			.get_user_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((res) => {
				if ('message' in res) return;
				const userData = res as API_USER_DATA;

				this.createdBy = `${userData.firstName} ${userData.lastName}`;
			});
	}

	private mapContentsToTableUI(contents: API_CONTENT[]): UI_TABLE_ADVERTISERS_CONTENT[] {
		let count = 1;
		let role = this._auth.current_role;
		if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			role = UI_ROLE_DEFINITION_TEXT.administrator;
		}

		return contents.map((content) => {
			return {
				id: { value: content.advertiserId, link: null, editable: false, hidden: true },
				index: { value: count++, link: null, editable: false, hidden: false },
				name: {
					value: this.parseFileName(content.fileName),
					link: `/` + role + `/media-library/${content.contentId}`,
					new_tab_link: true,
					editable: false,
					hidden: false
				},
				type: {
					value:
						content.fileType == 'jpeg' || content.fileType == 'jfif' || content.fileType == 'jpg' || content.fileType == 'png'
							? 'Image'
							: 'Video',
					link: null,
					editable: false,
					hidden: false
				},
				uploadDate: { value: this._date.transform(content.dateCreated, 'MMMM d, y') },
				uploadedBy: { value: content.createdByName ? content.createdByName : '--', link: null, editable: false, hidden: false }
			};
		});
	}

	private parseFileName(name: string) {
		if (name.split('_').length === 1) return name;
		const segments = name.split('_');
		segments.splice(0, 1);
		return segments.join('');
	}

	private setDescription(): void {
		const advertiser = this.advertiser;
		const state = advertiser.state ? advertiser.state : '';
		const region = advertiser.region ? advertiser.region : '';
		this.description = `${state} ${region} - Advertiser since ${this._date.transform(advertiser.dateCreated)}`;
	}
}
