import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

@Injectable({
	providedIn: 'root'
})

export class FilestackService {

	subscription: Subscription = new Subscription;

	constructor(private _http: HttpClient) {
	}

	http_options = {
		headers: new HttpHeaders(
			{ 'Content-Type': 'application/json' }
		)
	};

	convert_videos(data):any {
		return new Promise((resolve, reject) => {
			// Pass data to Backend then Convert Video
			console.log('#convert_videos', data);
			let handle = data.handle;
			let filename = data.key.split('.')[0];
			let originalName = data.filename;

			this.subscription.add(
				// 1280×720 
				this._http.get<any>(`https://cdn.filestackcontent.com/${environment.third_party.filestack_api_key}/video_convert=preset:webm,width:1024,height:576,video_bitrate:3000,filename:${filename}/${handle}`).subscribe(
					data => {
						resolve(data);
					},
					error => {
						console.log('#convert_videos', error);
						reject(error);
					}
				)
			)
		})
	}

	process_uploaded_files(file_data, users) {
		return new Promise((resolve, reject) => {
			let file_array = [];

			file_data.map(async file => {
				let filename: string = file.key;
	
				// Change mp4 filetype/filename to webm
				if (file.mimetype === 'video/mp4') {
					console.log('is', file.mimetype);
					filename = `${file.key.split('.')[0] }.webm`;
					let convert_data = await this.convert_videos(file);
					const upload_data = {
						'hostid': users ? users.host : '',
						'dealerid': users ? users.dealer : '',
						'advertiserid': users ? users.advertiser : '',
						'handle': file.handle,
						'filename': filename,
						'filesize': file.size,
						'uuid': convert_data.uuid
					}

					// Uploaded File Data Model for backend saving
					file_array.push(upload_data);

					if (file_data.length == file_array.length) {
						resolve(file_array);
					}
				} else {

					const upload_data = {
						'hostid': users ? users.host : '',
						'dealerid': users ? users.dealer : '',
						'advertiserid': users ? users.advertiser : '',
						'handle': file.handle,
						'filename': filename,
						'filesize': file.size
					}

					// Uploaded File Data Model for backend saving
					file_array.push(upload_data);
	
					if (file_data.length == file_array.length) {
						resolve(file_array);
					}
				}
			});
		})
	}

	post_content_info(file_data) {
		return this._http.post(`${environment.base_uri}${environment.third_party.api_post_content_info}`, file_data, this.http_options);
	}

	process_files() {
		return this._http.get(`${environment.base_uri}${environment.third_party.api_process_files}`);
	}
}