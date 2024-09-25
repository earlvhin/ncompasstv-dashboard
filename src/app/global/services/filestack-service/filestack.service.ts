import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { File } from 'filestack-js/build/main/lib/api/upload';

import { environment } from 'src/environments/environment';
import { BaseService } from '../base.service';
import { AuthService } from '../auth-service/auth.service';
import { AssignedUsers, FileConverted, FileUpload } from 'src/app/global/models';

@Injectable({
    providedIn: 'root',
})
export class FilestackService extends BaseService {
    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    private async convertVideos(data: File, fillerId?: string, fillers?: boolean, env?: string) {
        const setFileName = (data: File) => {
            const indexToCheck = fillers ? 'filename' : 'key';
            return data[indexToCheck].substring(0, data[indexToCheck].lastIndexOf('.'));
        };

        const path = fillers && fillerId ? `path:"fillers/${env}/${fillerId}",` : '';
        const handle = data.handle;
        const filename = setFileName(data);
        const url = `https://cdn.filestackcontent.com/${environment.third_party.filestack_api_key}/video_convert=preset:webm,width:848,height:480,video_bitrate:1000,${path}filename:${filename}/${handle}`;

        try {
            const converted: FileConverted = await this.getRequest(url, null, true, true).toPromise();
            return converted;
        } catch (err) {
            console.error('Failed to convert videos', err);
            throw err;
        }
    }

    /**
     * Processes a batch of uploaded files, converting video files to `.webm` format if required.
     * Assigns metadata to each file, including dealer, host, advertiser information, and classification.
     * Optionally generates a thumbnail for non-converted video files.
     *
     * @param {File[]} fileData - Array of file objects to process.
     * @param {AssignedUsers} [users] - (Optional) The users to whom the files are assigned (e.g., advertiser, dealer, host).
     * @param {boolean} [fillers] - (Optional) Flag indicating if the files are filler content.
     * @param {string} [group] - (Optional) Group identifier used for organizing files during conversion.
     * @param {string} [env] - (Optional) Environment identifier for file processing (e.g., 'dev', 'prod').
     * @returns {Promise<FileUpload[] | false>} - Resolves with an array of processed file metadata or `false` if an error occurs.
     *
     */
    public async processUploadedFiles(
        fileData: File[],
        users?: AssignedUsers,
        fillers?: boolean,
        group?: string,
        env?: string,
    ): Promise<FileUpload[] | false> {
        const convertToWebm = localStorage.getItem('optimize_video') === 'false' ? false : true;
        const fileStackBaseUrl = 'https://cdn.filestackcontent.com/video_convert=preset:thumbnail,thumbnail_offset:5';

        const isAssigned = (users: AssignedUsers, id: 'advertiser' | 'dealer' | 'host'): string => {
            const hasValue = (data: string): boolean =>
                typeof data !== 'undefined' && data !== null && data.trim().length > 0;

            if (!users) return '';

            let idToCheck: string | null = null;

            switch (id) {
                case 'advertiser':
                    idToCheck = users.advertiserId;
                    break;
                case 'host':
                    idToCheck = users.hostId;
                    break;
                default: // dealer
                    idToCheck = users.dealerId;
            }

            return hasValue(idToCheck) ? idToCheck : '';
        };

        const advertiserId = isAssigned(users, 'advertiser');
        const hostId = isAssigned(users, 'host');
        const dealerId = isAssigned(users, 'dealer');

        try {
            const fileArray: FileUpload[] = [];

            for (const file of fileData) {
                let filename: string = file.key;

                // Change mp4 filetype/filename to webm
                if (file.mimetype === 'video/mp4' && convertToWebm) {
                    filename = `${file.key.substring(0, file.key.lastIndexOf('.'))}.webm`;

                    let convertedFile: FileConverted;

                    if (fillers) {
                        let newFilename = file.key.split('/').pop();
                        file.name = newFilename;
                        convertedFile = await this.convertVideos(file, group, true, env);
                    } else {
                        convertedFile = await this.convertVideos(file);
                    }

                    const uploadData: FileUpload = {
                        dealerid: dealerId,
                        hostid: hostId,
                        advertiserid: advertiserId,
                        handle: file.handle,
                        filename: filename,
                        filesize: file.size,
                        uuid: convertedFile.uuid,
                        classification: fillers ? 'filler-v2' : '',
                    };

                    fileArray.push(uploadData);
                } else {
                    const uploadData: FileUpload = {
                        dealerid: dealerId,
                        hostid: hostId,
                        advertiserid: advertiserId,
                        handle: file.handle,
                        filename: filename,
                        filesize: file.size,
                        isconverted: convertToWebm ? 0 : 1,
                        classification: fillers ? 'filler-v2' : '',
                    };

                    // Generate MP4 Thumbnail
                    if (!convertToWebm && file.mimetype === 'video/mp4') {
                        const url = `${fileStackBaseUrl}/${file.handle}`;
                        await fetch(url);
                    }

                    fileArray.push(uploadData);
                }
            }

            // Return the fileArray once processing is complete
            return fileArray;
        } catch (err) {
            console.error('Failed to process files', err);
            return false;
        }
    }

    post_content_info(file_data) {
        const endpoint = `${environment.third_party.api_post_content_info}`;
        return this.postRequest(endpoint, file_data, null, true);
    }

    process_files() {
        const endpoint = `${environment.third_party.api_process_files}`;
        return this.getRequest(endpoint);
    }
}
