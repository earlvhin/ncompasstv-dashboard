import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { TAG, TAG_TYPE, TAG_OWNER, PAGING } from 'src/app/global/models';
import { TagService } from 'src/app/global/services';
import { EditTagComponent } from '../../dialogs';

@Component({
    selector: 'app-tags-table',
    templateUrl: './tags-table.component.html',
    styleUrls: ['./tags-table.component.scss'],
})
export class TagsTableComponent implements OnInit, OnDestroy {
    @Input() currentTagType: TAG_TYPE;
    @Input() currentUserId: string;
    @Input() currentUserRole: string;
    @Input() isLoading = true;
    @Input() paging: PAGING;
    @Input() tab: string;
    @Input() tableColumns: any[];
    @Input() tableType: 'tags' | 'tag-owners' = 'tags';
    @Input() tagOwners: TAG_OWNER[];
    @Input() tableData: TAG[] | TAG_OWNER[] = [];
    @Output() onClickTagName = new EventEmitter<{ tag: string }>();
    @Output() onClickPageNumber = new EventEmitter<number>();

    ownerIcons: any;
    page: number;
    selectedArray: any = [];
    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _dialog: MatDialog,
        private _tag: TagService,
    ) {}

    ngOnInit() {
        this.ownerIcons = this.ownerIconsList;
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    async onDeleteTag(id: string): Promise<void> {
        const response = await this.openConfirmAPIRequestDialog('delete_tag').toPromise();

        if (!response) return;

        this._tag
            .deleteTag([id])
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => {
                    this._tag.onRefreshTagOwnersTable.next();
                    this._tag.onRefreshTagsTable.next();
                    this._tag.onRefreshTagsCount.next();
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    async onDeleteAllTagsFromOwner(ownerId: string): Promise<void> {
        const response = await this.openConfirmAPIRequestDialog(
            'delete_all_tags_from_owner',
        ).toPromise();

        if (!response) return;

        this._tag
            .deleteAllTagsFromOwner(ownerId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => {
                    this._tag.onRefreshTagOwnersTable.next();
                    this._tag.onRefreshTagsTable.next();
                    this._tag.onRefreshTagsCount.next();
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    async onDeleteTagFromOwner(tagId: string, ownerId: string): Promise<void> {
        const response =
            await this.openConfirmAPIRequestDialog('delete_tag_from_owner').toPromise();

        if (!response) return;

        this._tag
            .deleteTagByIdAndOwner(tagId, ownerId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => {
                    this._tag.onRefreshTagOwnersTable.next();
                    this._tag.onRefreshTagsTable.next();
                    this._tag.onRefreshTagsCount.next();
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    clickedPageNumber(page: number): void {
        this.selectedArray = [];
        this.onClickPageNumber.emit(page);
    }

    clickedTagName(data: TAG): void {
        this._tag.onClickTagName.next({ tag: data, tab: this.tab });
    }

    onPageChange(page: number): void {
        this.page = page;
        window.scrollTo(0, 0);
    }

    openDialog(type: string, data: TAG | TAG_OWNER) {
        let dialog: MatDialogRef<EditTagComponent>;

        switch (type) {
            case 'edit_tag':
                dialog = this._dialog.open(EditTagComponent, {
                    width: '500px',
                }) as MatDialogRef<EditTagComponent>;
                dialog.componentInstance.tag = data as TAG;
                dialog.componentInstance.currentUserId = this.currentUserId;
                break;
        }

        dialog.afterClosed().subscribe((response: boolean) => {
            if (!response) return;
        });
    }

    setTagColor(value: string): string {
        return value ? value : 'gray';
    }

    private get ownerIconsList() {
        return {
            dealer: 'D',
            license: 'L',
            host: 'H',
            advertiser: 'A',
        };
    }

    private openConfirmAPIRequestDialog(type: string, data = {}) {
        let message: string;
        let title: string;
        let status = 'warning';
        let return_msg: string;
        let width = '500px';
        let height = '350px';

        switch (type) {
            case 'delete_tag':
                title = 'Delete Tag';
                message = `Associated owners will be removed from this tag`;
                return_msg = 'Confirmed deletion';
                break;

            case 'delete_tag_from_owner':
                title = 'Remove Tag';
                message = `This will remove the tag from the assignee`;
                break;

            case 'delete_all_tags_from_owner':
                title = 'Delete Assignee Tags';
                message = `ALL tags from assignee will be removed`;
                return_msg = 'Confirmed deletion';
                break;
        }

        return this._dialog
            .open(ConfirmationModalComponent, {
                width,
                height,
                data: { status, message: title, data: message, return_msg },
            })
            .afterClosed();
    }
}
