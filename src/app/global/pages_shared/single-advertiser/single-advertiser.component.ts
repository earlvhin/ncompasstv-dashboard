import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common'
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_CONTENT, UI_TABLE_ADVERTISERS_CONTENT } from 'src/app/global/models';
import { AdvertiserService, ContentService, HelperService } from 'src/app/global/services';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

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
	is_view_only = false;
	selected_index: number;
	table_columns = [ '#', 'Name', 'Type', 'Upload Date', 'Uploaded By' ];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _date: DatePipe,
		private _helper: HelperService,
		private _params: ActivatedRoute,
		private _content: ContentService,
	) { }

	ngOnInit() {

		this.is_view_only = this.currentUser.roleInfo.permission === 'V';

		this._params.paramMap.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.advertiser_id = this._params.snapshot.params.data;
					this.getAdvertiserInfo(this.advertiser_id);
					this.getContents(this.advertiser_id);
				}
			);

		this._params.queryParams.pipe(takeUntil(this._unsubscribe)).subscribe(data => this.selected_index = data.tab);
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
			)
			.add(() => this.is_initial_load = false);

	}

	getContents(id: string) {
		
		this._content.get_content_by_advertiser_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT[] | { message: string }) => {
					this.content_data = response;
					if (!Array.isArray(response)) return;
					const data = response as API_CONTENT[];
					this.array_to_preview = response;
					this.content_data = this.mapContentsToTableUI(data);
				},
				error => console.log('Error retrieving advertiser contents', error)
			);

	}

	private mapContentsToTableUI(contents: API_CONTENT[]): UI_TABLE_ADVERTISERS_CONTENT[] {
		let count = 1;

		return contents.map(
			content => {
				return {
					id: { value: content.advertiserId, link: null , editable: false, hidden: true} ,
					index: { value: count++, link: null , editable: false, hidden: false },
					name: { value: this.parseFileName(content.fileName), link: `/${this.currentRole}/media-library/${content.contentId}`, new_tab_link: true, editable: false, hidden: false },
					type: { value: content.fileType == 'jpeg' || content.fileType == 'jfif' || content.fileType == 'jpg' || content.fileType == 'png' ? 'Image' : 'Video', link: null , editable: false, hidden: false },
					uploadDate: { value: this._date.transform(content.dateCreated, 'MMMM d, y') },
					uploadedBy: { value: content.createdByName ? content.createdByName : '--', link: null , editable: false, hidden: false },
				}
			}
		);
	}

	private parseFileName(name: string) {
		if (name.split('_').length === 1) return name;
		const segments = name.split('_');
		segments.splice(0, 1);
		return segments.join('');
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

}

