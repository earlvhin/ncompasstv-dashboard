import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class FilestackService {
	subscription: Subscription = new Subscription();

	constructor(private _http: HttpClient) {}

	http_options = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json' })
	};

	convert_videos(data): any {
		return new Promise((resolve, reject) => {
			// Pass data to Backend then Convert Video
			let handle = data.handle;
			let filename = data.key.substring(0, data.key.lastIndexOf('.'));
			let originalName = data.filename;

			this.subscription.add(
				this._http
					.get<any>(
						`https://cdn.filestackcontent.com/${environment.third_party.filestack_api_key}/video_convert=preset:webm,width:848,height:480,video_bitrate:1000,filename:${filename}/${handle}`
					)
					.subscribe(
						(data) => {
							resolve(data);
						},
						(error) => {
							reject(error);
						}
					)
			);
		});
	}

	process_uploaded_files(file_data, users) {
		const convert_to_webm = localStorage.getItem('optimize_video') == 'false' ? false : true;

		return new Promise((resolve, reject) => {
			let file_array = [];

			file_data.map(async (file) => {
				let filename: string = file.key;

				// Change mp4 filetype/filename to webm
				if (file.mimetype === 'video/mp4' && convert_to_webm) {
					filename = `${file.key.substring(0, file.key.lastIndexOf('.'))}.webm`;
					// filename = `${file.key.substring(0, file.key.lastIndexOf("."))}.mp4`;

					let convert_data = await this.convert_videos(file);

					const upload_data = {
						hostid: users ? users.host : '',
						dealerid: users ? users.dealer : '',
						advertiserid: users ? users.advertiser : '',
						handle: file.handle,
						filename: filename,
						filesize: file.size,
						uuid: convert_data.uuid
					};

					// Uploaded File Data Model for backend saving
					file_array.push(upload_data);

					if (file_data.length == file_array.length) {
						resolve(file_array);
					}
				} else {
					const upload_data = {
						hostid: users ? users.host : '',
						dealerid: users ? users.dealer : '',
						advertiserid: users ? users.advertiser : '',
						handle: file.handle,
						filename: filename,
						filesize: file.size,
						isconverted: !convert_to_webm ? 1 : 0
					};

					// Generate MP4 Thumbnail
					if (!convert_to_webm && file.mimetype === 'video/mp4') {
						await fetch(`https://cdn.filestackcontent.com/video_convert=preset:thumbnail,thumbnail_offset:5/${file.handle}`);
					}

					// Uploaded File Data Model for backend saving
					file_array.push(upload_data);

					if (file_data.length == file_array.length) {
						resolve(file_array);
					}
				}
			});
		});
	}

	post_content_info(file_data) {
		return this._http.post(`${environment.base_uri}${environment.third_party.api_post_content_info}`, file_data, this.http_options);
	}

	process_files() {
		return this._http.get(`${environment.base_uri}${environment.third_party.api_process_files}`);
	}
}
