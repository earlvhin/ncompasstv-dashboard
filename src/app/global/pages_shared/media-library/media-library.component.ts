import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import * as filestack from 'filestack-js';
import { Subject } from 'rxjs';

import { environment } from 'src/environments/environment';
import { UI_ROLE_DEFINITION } from 'src/app/global/models';
import { AuthService, ContentService, FilestackService } from 'src/app/global/services';
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

    protected _unsubscribe: Subject<void> = new Subject<void>();

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
            this.getSummaryContents();
        }

        this.is_view_only = this.currentUser.roleInfo.permission === 'V';
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    assignContent() {
        let dialogRef = this._dialog.open(MediaModalComponent, {
            width: '768px',
            panelClass: 'app-media-modal',
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((r) => {
            this.assigned_users = r;
            this.loading_overlay = true;
            if (r != false) {
                this.uploadContent();
            } else {
                this.loading_overlay = false;
            }
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
            .pipe(takeUntil(this._unsubscribe))
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

    getSummaryContents(): void {
        this._content
            .get_contents_summary()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response: any) => {
                    if (!response.message) {
                        this.summarized_media = response.contents;
                    }
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getDealerContents(id: string, page: number, pageSize: number): void {
        this._content
            .get_content_by_dealer_id(id, false, page, pageSize)
            .pipe(takeUntil(this._unsubscribe))
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
                    // Do something async
                    this.all_media.map((med) => {
                        if (med.title != null && !this.removed_index) {
                            med.fileName = med.title;
                            var name_no_index = this.removeIndexes(med.fileName);
                            med.fileName = name_no_index + '.' + med.fileType;
                        } else {
                            var temp = med.fileName.split('.');
                            med.fileName = this.removeIndexes(med.fileName);
                            med.fileName = med.fileName + '.' + temp[temp.length - 1];
                        }
                    });

                    //Additional Checking for video conversion duplicate
                    if (e.originalFile.type.includes('video') && !convert_to_webm) {
                        var temp = e.originalFile.name.substr(
                            0,
                            e.originalFile.name.lastIndexOf('.'),
                        );
                        temp = temp + '.webm';
                        e.originalFile.name = temp;
                    }

                    e.originalFile.name = e.originalFile.name.substr(
                        0,
                        e.originalFile.name.lastIndexOf('.'),
                    );

                    if (!this.is_dealer) {
                        this.duplicate_files = this.summarized_media.filter((media) => {
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
                            if (result === 'upload') {
                                this.postContentInfo(
                                    this.duplicate_files,
                                    this.data_to_upload,
                                    false,
                                );
                                resolve({ filename: this.modified_data[0].filename });
                                //temporarily add recently uploaded to array
                                this.all_media.push({ fileName: this.modified_data[0].filename });
                            } else {
                                this.renameModal().then((name) => {
                                    var temp = this.data_to_upload[0].mimetype.split('/');
                                    resolve({ filename: name + '.' + temp[temp.length - 1] });
                                });
                            }
                        });
                    } else {
                        resolve({});
                    }
                });
            },
            onOpen: (e) => {
                this.ngOnInit();
            },
            onUploadDone: (respond) => {
                this.uploaded_files = respond.filesUploaded;
                this.reload = true;
                this.processUploadedFiles(this.uploaded_files, this.assigned_users);
            },
            onClose: (respond) => {
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

    renameModal(): Promise<void> {
        return new Promise((resolve) => {
            this._dialog.closeAll();

            const dialogRef = this._dialog.open(RenameModalComponent, {
                width: '500px',
                height: '450px',
                panelClass: 'app-media-modal',
                disableClose: true,
            });

            dialogRef.afterClosed().subscribe((r) => resolve(r));
        });
    }

    async processUploadedFiles(data, users): Promise<void> {
        const file_data = await this._filestack.process_uploaded_files(data, users || '');
        if (file_data) {
            this.postContentInfo('', file_data, true);
        }
    }

    removeIndexes(data) {
        if (data.indexOf('(') > 0) {
            return data.slice(0, data.indexOf('('));
        } else {
            return data.slice(0, data.indexOf('.'));
        }
    }

    postContentInfo(duplicateArray, data, upload): void {
        data.map((i) => {
            if (i.fileName) {
                i.filename = i.fileName;
            }
            i.createdBy = this._auth.current_user_value.user_id;

            if (duplicateArray) {
                const name_of_file = this.removeIndexes(i.filename);
                const mime = i.mimetype.split('/');
                const index_to_set = duplicateArray.length + 1;
                i.filename = name_of_file + '(' + index_to_set + ')' + '.' + mime[mime.length - 1];
                delete i.fileName;
            }
        });

        this.modified_data = data;

        if (upload) {
            this._filestack
                .post_content_info(data)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    () => {
                        this.emitReloadMedia();
                    },
                    (error) => {
                        console.error(error);
                    },
                );
        }
    }

    processFiles(): void {
        this._filestack
            .process_files()
            .pipe(takeUntil(this._unsubscribe))
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
