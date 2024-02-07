import { Component, OnInit } from '@angular/core';
import { ContentService, AuthService } from '../../services';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';

@Component({
    selector: 'app-expired-contents',
    templateUrl: './expired-contents.component.html',
    styleUrls: ['./expired-contents.component.scss'],
})
export class ExpiredContentsComponent implements OnInit {
    contents: any = [];
    current_type = '';
    dealer_id: string;
    file_name: string;
    has_content_selected: boolean = false;
    is_loading: boolean = false;
    search_data = '';
    selected_content: any;
    selected_count: number = 0;
    selection_for_delete = [];
    title = 'Unused Content Gallery';
    total_contents: number = 0;

    constructor(
        private _content: ContentService,
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _router: Router,
    ) {}

    ngOnInit() {
        this.dealer_id = this.currentUser.roleInfo.dealerId;
        this.getAllContents(true);
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    private getAllContents(initial?) {
        if (initial) {
            this.selected_content = [];
            this.selected_count = 0;
            this.selection_for_delete = [];
            this.has_content_selected = false;
        }
        this.is_loading = true;
        this._content
            .get_unused_contents(this.dealer_id, this.current_type, this.search_data)
            .subscribe((data) => {
                this.contents = data.contents;
                if (initial) {
                    this.total_contents = data.paging.totalEntities;
                    this.contents.map((content) => {
                        if (content.forDeletion == 1) this.onCheckContent(true, content.contentId);
                    });
                }
            })
            .add(() => (this.is_loading = false));
    }

    selectedContent(content) {
        this.has_content_selected = true;
        content.file_type = this.checkFileType(content);
        this.selected_content = content;
    }

    checkFileType(content) {
        if (content.fileType == 'feed') return 'Feed';
        else if (
            content.fileType == 'jpeg' ||
            content.fileType == 'jfif' ||
            content.fileType == 'jpg' ||
            content.fileType == 'png'
        )
            return 'Image';
        else return 'Video';
    }

    onSelectAllToggle(value) {
        this.selected_count = 0;
        this.contents.map((content) => {
            content.forDeletion = value ? 1 : 0;
            this.onCheckContent(value, content.contentId);
        });
    }

    filterContent(type) {
        this.current_type = type;
        this.getAllContents();
    }

    clearFilter() {
        this.current_type = '';
        this.getAllContents();
    }

    filterData(key) {
        if (key) this.search_data = key;
        else this.search_data = '';
        this.getAllContents();
    }

    navigateToContent(id) {
        this._router.navigate([]).then(() => {
            window.open(`/dealer/media-library/` + id, '_blank');
        });
    }

    onCheckContent(value, content) {
        if (value) {
            this.selection_for_delete.push({
                contentId: content,
                forDeletion: !value ? 0 : 1,
            });
            this.selected_count += 1;
        } else {
            this.selection_for_delete.map((item) => {
                if (item.contentId === content) item.forDeletion = 0;
            });
            this.selected_count -= 1;
        }
        this.contents.find((cont) => cont.contentId == content).forDeletion = !value ? 0 : 1;
    }

    saveForDeletion() {
        this._content.update_unused_contents(this.selection_for_delete).subscribe((data) => {
            this.openConfirmationModal(
                'success',
                'Success!',
                'Unused Contents list to be deleted updated!',
            );
        });
    }

    openConfirmationModal(status, message, data): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: { status, message, data },
            })
            .afterClosed()
            .subscribe(() => this.ngOnInit());
    }
}
