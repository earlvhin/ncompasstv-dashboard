import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_CONTENT, UI_TABLE_ADVERTISERS_CONTENT, UI_ROLE_DEFINITION_TEXT, API_ADVERTISER, API_DEALER } from 'src/app/global/models';
import { AdvertiserService, ContentService, HelperService, DealerService } from 'src/app/global/services';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Component({
	selector: 'app-single-advertiser',
	templateUrl: './single-advertiser.component.html',
	styleUrls: ['./single-advertiser.component.scss'],
	providers: [DatePipe]
})
export class SingleAdvertiserComponent implements OnInit, OnDestroy {
	array_to_preview: API_CONTENT[] = [];
	advertiser: API_ADVERTISER;
	advertiserAndDealer: { advertiser: API_ADVERTISER; dealer: API_DEALER } = null;
	advertiser_id: string;
	content_data: any = [];
	currentImage = 'assets/media-files/admin-icon.png';
	current_user = this._auth.current_user_value;
	current_role = this._auth.current_role;
	contents_loaded = false;
	dealer: API_DEALER;
	description: string;
	is_banner_data_ready = false;
	has_only_view_permission = this._auth.current_user_value.roleInfo.permission === 'V';
	selected_index: number;
	table_columns = ['#', 'Name', 'Type', 'Upload Date', 'Uploaded By'];

	private is_loading = false;
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _date: DatePipe,
		private _dealer: DealerService,
		private _helper: HelperService,
		private _params: ActivatedRoute,
		private _content: ContentService
	) {}

	ngOnInit() {
		this._params.paramMap.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			this.advertiser_id = this._params.snapshot.params.data;
			this.getAdvertiser();
			this.getContents();
		});

		this._params.queryParams.pipe(takeUntil(this._unsubscribe)).subscribe((data) => (this.selected_index = data.tab));
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private async getAdvertiser() {
		let dealer: API_DEALER;

		if (this.is_loading && (this.current_role === 'dealer' || this.current_role === 'sub-dealer')) {
			this.advertiser = this._helper.singleAdvertiserData;
			this.setDescription();

			try {
				dealer = await this._dealer.get_dealer_by_id(this.advertiser.dealerId).toPromise();
			} catch (error) {
				throw new Error(error);
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

					try {
						dealer = await this._dealer.get_dealer_by_id(advertiser.dealerId).toPromise();
					} catch (error) {
						throw new Error(error);
					}

					this.advertiserAndDealer = { advertiser, dealer };
					if (response.advertiser.logo) this.currentImage = response.advertiser.logo;
					this.is_banner_data_ready = true;
				},
				(error) => {
					throw new Error(error);
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
					throw new Error(error);
				}
			)
			.add(() => (this.contents_loaded = true));
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
