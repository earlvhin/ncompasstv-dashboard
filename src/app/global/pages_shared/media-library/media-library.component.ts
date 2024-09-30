import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { File } from 'filestack-js/build/main/lib/api/upload';
import * as filestack from 'filestack-js';
import { Subject } from 'rxjs';

import { environment } from 'src/environments/environment';

// Models
import { API_MINIFIED_CONTENT, AssignedUsers, FileUpload, UI_ROLE_DEFINITION } from 'src/app/global/models';

// Services
import { AuthService, ContentService, FilestackService } from 'src/app/global/services';

// Components
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { MediaModalComponent } from '../../components_shared/media_components/media-modal/media-modal.component';
import { RenameModalComponent } from '../../components_shared/media_components/rename-modal/rename-modal.component';

@Component({
    selector: 'app-media-library',
    templateUrl: './media-library.component.html',
    styleUrls: ['./media-library.component.scss'],
})
export class MediaLibraryComponent implements OnInit, OnDestroy {
    advertiser_field_disabled: boolean = true;
    assigned_users: any;
    data_to_upload: any = [];
    dealer_field_disabled: boolean = true;
    duplicate_files: any = [];
    eventsSubject: Subject<void> = new Subject<void>();
    filestack_client: any;
    host_field_disabled: boolean = true;
    loading_overlay: boolean = false;
    modified_data: any = [];
    reload: boolean;
    removed_index: boolean = false;
    summarized_media: any = [];
    title: string = 'Media Library';
    upload_respond: any;
    uploaded_files: any;
    all_media: any = [];
    is_dealer: boolean = false;
    is_view_only = false;
    compare: any;
    count_1: any;
    count_2: any;
    count_3: any;

    private assignedUsers: { advertiserId: string; dealerId: string; hostId: string };
    private minifiedContents: API_MINIFIED_CONTENT[] = [];
    protected ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _content: ContentService,
        private _dialog: MatDialog,
        private _filestack: FilestackService,
    ) {}

    ngOnInit() {
        this.filestack_client = filestack.init(environment.third_party.filestack_api_key);
        const roleId = this._auth.current_user_value.role_id;

        if (roleId === UI_ROLE_DEFINITION.dealer || roleId === UI_ROLE_DEFINITION['sub-dealer']) {
            this.is_dealer = true;
            this.getDealerContents(this._auth.current_user_value.roleInfo.dealerId, 1, 60);
        } else {
            this.getContents();
            this.getMinifiedContents();
        }

        this.is_view_only = this.currentUser.roleInfo.permission === 'V';
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Opens a media selection dialog for assigning content to users.
     * Once the dialog is closed, it checks if users have been assigned and
     * proceeds with the content upload if valid user data is returned.
     * The loading overlay is shown during the process and hidden if no users are assigned.
     *
     * @public
     * @returns {void}
     */
    public assignContent(): void {
        this.loading_overlay = true;

        this._dialog
            .open(MediaModalComponent, {
                width: '768px',
                panelClass: 'app-media-modal',
                disableClose: true,
            })
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((res: AssignedUsers) => {
                this.assignedUsers = res;

                if (typeof res === 'undefined' || !res) {
                    this.loading_overlay = false;
                    return;
                }

                this.uploadContent();
            });
    }

    displayStats(e): void {
        if (e) {
            this.compare = {
                basis: e.all,
                basis_label: 'Contents',
            };

            this.count_1 = {
                data_value: e.videos,
                data_label: 'Videos',
                data_description: 'Videos',
            };

            this.count_2 = {
                data_value: e.images,
                data_label: 'Images',
                data_description: 'Images',
            };

            this.count_3 = {
                data_value: e.feeds,
                data_label: 'Feeds',
                data_description: 'Feeds',
            };
        } else {
            this.compare = false;
            this.count_1 = false;
            this.count_2 = false;
        }
    }

    getContents(): void {
        this._content
            .get_contents_with_page()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response: any) => {
                    if (!response.message) {
                        this.all_media = response.iContents;
                    }
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    /**
     * Retrieves a list of minified content data and assigns it to the `minifiedContents` property.
     * The method subscribes to the observable returned by the `getMinifiedContents` service and processes the response.
     * If the response contains a `message`, the operation is halted.
     * Otherwise, the `contents` from the response are assigned to the `minifiedContents` property.
     *
     * @private
     * @returns {void}
     *
     * @example
     * this.getMinifiedContents();
     */
    private getMinifiedContents(): void {
        this._content
            .getMinifiedContents()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (response) => {
                    if ('message' in response) return;
                    this.minifiedContents = response.contents;
                },
                error: (err) => {
                    console.error('Failed to retrieve minified contents', err);
                },
            });
    }

    getDealerContents(id: string, page: number, pageSize: number): void {
        this._content
            .get_content_by_dealer_id(id, false, page, pageSize)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response: any) => {
                    if (!response.message) {
                        this.all_media = response.contents;
                    }
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    uploadContent(): void {
        const convert_to_webm = localStorage.getItem('optimize_video') == 'false' ? false : true;

        const filestack_option = {
            accept: ['image/jpg', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm'],
            maxFiles: 10,
            imageMax: [1280, 720],
            onFileSelected: (e) => {
                this.data_to_upload = [];
                return new Promise((resolve, reject) => {
                    this.all_media.map((med) => {
                        if (med.title != null && !this.removed_index) {
                            med.fileName = med.title;
                            var name_no_index = this.removeIndices(med.fileName);
                            med.fileName = name_no_index + '.' + med.fileType;
                        } else {
                            var temp = med.fileName.split('.');
                            med.fileName = this.removeIndices(med.fileName);
                            med.fileName = med.fileName + '.' + temp[temp.length - 1];
                        }
                    });

                    // Additional checking for video conversion duplicates
                    if (e.originalFile.type.includes('video') && !convert_to_webm) {
                        var temp = e.originalFile.name.substr(0, e.originalFile.name.lastIndexOf('.'));
                        temp = temp + '.webm';
                        e.originalFile.name = temp;
                    }

                    e.originalFile.name = e.originalFile.name.substr(0, e.originalFile.name.lastIndexOf('.'));

                    if (!this.is_dealer) {
                        this.duplicate_files = this.minifiedContents.filter((media) => {
                            return media.title.indexOf(e.originalFile.name) !== -1;
                        });
                    } else {
                        this.duplicate_files = this.all_media.filter((media) => {
                            return media.title.indexOf(e.originalFile.name) !== -1;
                        });
                    }

                    if (this.duplicate_files.length > 0) {
                        this.data_to_upload.push(e);

                        this.warningModal(
                            'warning',
                            'Duplicate Filename',
                            'Are you sure you want to continue upload?',
                            '',
                            'rename',
                        ).then((result) => {
                            switch (result) {
                                case 'upload':
                                    this.postContentInfo(this.data_to_upload, this.duplicate_files, false);

                                    resolve({ filename: this.modified_data[0].filename });

                                    // Temporarily add recently uploaded to array
                                    this.all_media.push({ fileName: this.modified_data[0].filename });
                                    break;
                                case 'rename':
                                    // Rename the file
                                    this.renameModal(e.originalFile.name).then((name) => {
                                        if (name) {
                                            const temp = this.data_to_upload[0].mimetype.split('/');
                                            resolve({ filename: `${name}.${temp[temp.length - 1]}` });
                                        } else {
                                            // Rename dialog was canceled, reject the promise
                                            reject('Rename canceled');
                                        }
                                    });
                                    break;
                                default:
                                    reject('Upload canceled');
                                    return;
                            }
                        });
                    } else {
                        resolve({});
                    }
                });
            },
            onOpen: () => {
                this.ngOnInit();
            },
            onUploadDone: async (res: { filesFailed: File[]; filesUploaded: File[] }) => {
                this.reload = true;

                // Process the uploaded files
                const processedFiles = await this._filestack.processUploadedFiles(
                    res.filesUploaded,
                    this.assignedUsers || null,
                );

                if (!processedFiles) return;
                this.postContentInfo(processedFiles, null, true);
            },
            onClose: () => {
                this.loading_overlay = false;
            },
        };

        this.filestack_client.picker(filestack_option).open();
    }

    removeFilenameHandle(file_name: string): string {
        return file_name.substring(file_name.indexOf('_') + 1);
    }

    warningModal(
        status: string,
        message: string,
        data: string,
        return_msg: string,
        action: string,
    ): Promise<void | string> {
        return new Promise((resolve) => {
            this._dialog.closeAll();

            const dialogRef = this._dialog.open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                disableClose: true,
                data: {
                    status,
                    message,
                    data,
                    return_msg,
                    action,
                    rename: true,
                },
            });
            dialogRef.afterClosed().subscribe((result) => resolve(result));
        });
    }

    /**
     * Opens a rename modal dialog to rename a file.
     * @param {string} originalFilename - The original filename of the file to rename.
     * @returns {Promise<string | undefined>} - A promise that resolves with the new filename or undefined if the modal was closed.
     */
    public renameModal(originalFilename: string): Promise<string | undefined> {
        return this._dialog
            .open(RenameModalComponent, {
                width: '500px',
                height: '450px',
                panelClass: 'app-media-modal',
                data: {
                    originalFilename,
                    existingFilenames: this.all_media.map((media) => media.title),
                },
            })
            .afterClosed()
            .toPromise();
    }

    /**
     * Removes the indices (either parentheses or periods) from the given string.
     * It slices the string based on the first occurrence of either '(' or '.'.
     *
     * @private
     * @param {string} data - The string from which the indices are to be removed.
     * @returns {string} - The string without the indices.
     *
     */
    private removeIndices(data: string): string {
        const index = data.indexOf('(') > 0 ? data.indexOf('(') : data.indexOf('.');
        return data.slice(0, index);
    }

    /**
     * Modifies the file upload data to update filenames and adds user information before posting it.
     * If a duplicate array is provided, it renames files to avoid duplication by appending an index to the filename.
     * Optionally posts the content info to the backend if the upload flag is true.
     *
     * @private
     * @param {FileUpload[]} data - Array of file upload data to be processed.
     * @param {FileUpload[]} duplicateArray - Array of duplicate files used for renaming.
     * @param {boolean} upload - Flag indicating whether to upload the processed data or not.
     * @returns {void}
     * */
    private postContentInfo(data: FileUpload[], duplicateArray: FileUpload[], upload: boolean): void {
        data.map((i) => {
            if (i.fileName) i.filename = i.fileName;
            i.createdBy = this._auth.current_user_value.user_id;

            if (duplicateArray) {
                const name_of_file = this.removeIndices(i.filename);
                const mime = i.mimetype.split('/');
                const index_to_set = duplicateArray.length + 1;
                i.filename = name_of_file + '(' + index_to_set + ')' + '.' + mime[mime.length - 1];
                delete i.fileName;
            }
        });

        this.modified_data = data;

        if (!upload) return;

        this._filestack
            .post_content_info(data)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                () => {
                    this.emitReloadMedia();
                },
                (err) => {
                    console.error('Failed to post content info', err);
                },
            );
    }

    processFiles(): void {
        this._filestack
            .process_files()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                () => {
                    // this.compare = undefined;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    emitReloadMedia(): void {
        this.eventsSubject.next();
    }

    private get currentUser() {
        return this._auth.current_user_value;
    }
}
