import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AdvertiserService } from '../../services/advertiser-service/advertiser.service';
import { ContentService } from '../../services/content-service/content.service';
import { DatePipe } from '@angular/common'
import { UI_TABLE_ADVERTISERS_CONTENT } from '../../models/ui_table_advertisers_content.model';
import { API_ADVERTISER } from '../../models/api_advertiser.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { MatDialog } from '@angular/material/dialog';

@Component({
	selector: 'app-single-advertiser',
	templateUrl: './single-advertiser.component.html',
	styleUrls: ['./single-advertiser.component.scss'],
	providers: [DatePipe]
})

export class SingleAdvertiserComponent implements OnInit {
	
	array_to_preview: any = [];
	advertiser: any;
	advertiser_id: string;
	content_data: any = [];
	img: string = "assets/media_files/admin-icon.png";
	selected_index: number;
	subscription: Subscription = new Subscription;
	
	
	content_table_col = [
		'#',
		'Name',
		'Type',
		'Playing Where',
		'Uploaded By'
	]

	constructor(
		private _auth: AuthService,
		private _params: ActivatedRoute,
		private _date: DatePipe,
		private _advertiser: AdvertiserService,
		private _dialog: MatDialog,
		private _content: ContentService,
	) { }

	ngOnInit() {
		this.subscription.add(
			this._params.paramMap.subscribe(
				data => {
					this.advertiser_id = this._params.snapshot.params.data;
					this.getAdvertiserInfo(this.advertiser_id);
					this.getContents(this.advertiser_id);
				},
				error => {
					console.log(error)
				}
			)
		)

		this.subscription.add(
			this._params.queryParams.subscribe(
				data => {
					this.selected_index = data.tab;
				}
			)
		)
	}

	getAdvertiserInfo(id) {
		this._advertiser.get_advertiser_by_id(id).subscribe(
			val => {
				this.advertiser = val;
			}
		);
	}

	getContents(id) {
		this._content.get_content_by_advertiser_id(id).subscribe(
			val => {
				if(!val.message) {
					this.array_to_preview = val;
					this.content_data = this.contentTable_mapToUI(val);
				}
			}
		);
	}

	contentTable_mapToUI(data: any) {
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
		)
	}
}

