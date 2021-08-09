import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common'
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UI_TABLE_ADVERTISERS_CONTENT } from '../../models/ui_table_advertisers_content.model';

import { AdvertiserService, ContentService, AuthService, HelperService } from 'src/app/global/services';

@Component({
	selector: 'app-single-advertiser',
	templateUrl: './single-advertiser.component.html',
	styleUrls: ['./single-advertiser.component.scss'],
	providers: [DatePipe]
})

export class SingleAdvertiserComponent implements OnInit, OnDestroy {
	
	array_to_preview: any = [];
	advertiser: any;
	advertiser_id: string;
	content_data: any = [];
	img: string = "assets/media_files/admin-icon.png";
	is_initial_load = true;
	selected_index: number;
	subscription: Subscription = new Subscription;
	
	content_table_col = [
		'#',
		'Name',
		'Type',
		'Playing Where',
		'Uploaded By'
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _helper: HelperService,
		private _params: ActivatedRoute,
		private _content: ContentService,
	) { }

	ngOnInit() {

		this._params.paramMap
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.advertiser_id = this._params.snapshot.params.data;
					this.getAdvertiserInfo(this.advertiser_id);
					this.getContents(this.advertiser_id);
				}
			);

		this._params.queryParams
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					this.selected_index = data.tab;
				}
			);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getAdvertiserInfo(id: string): void {

		if (this.is_initial_load && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
			this.advertiser = this._helper.singleAdvertiserData;
			this.is_initial_load = false;
			return;
		}

		this._advertiser.get_advertiser_by_id(id, 'single-advertiser')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { advertiser, tags }) => {
					const { advertiser, tags } = response;
					advertiser.tags = tags;
					this.advertiser = advertiser;
				},
				error => console.log('Error retrieving advertiser', error)
			);

	}

	getContents(id: string): void {
		this._content.get_content_by_advertiser_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					if (response.message) return;
					this.array_to_preview = response;
					this.content_data = this.contentTable_mapToUI(response);
				},
				error => console.log('Error retrieving advertiser contents', error)
			);
	}

	private contentTable_mapToUI(data: any[]): UI_TABLE_ADVERTISERS_CONTENT[] {
		let count = 1;

		return data.map(
			h => {
				return new UI_TABLE_ADVERTISERS_CONTENT(
					{ value: h.advertiserId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: h.fileName, link: null , editable: false, hidden: false},
					{ value: h.fileType == 'jpeg' || h.fileType == 'jfif' || h.fileType == 'jpg' || h.fileType == 'png' ? 'Image' : 'Video', link: null , editable: false, hidden: false},
					{ value: h.playing_where ? h.playing_where : '--', link: null , editable: false, hidden: false},
					{ value:h.createdByName ? h.createdByName : '--', link: null , editable: false, hidden: false},
				)
			}
		);
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

}

