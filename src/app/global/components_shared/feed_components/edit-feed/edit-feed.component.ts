import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TitleCasePipe } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';

import { API_DEALER, PAGING, UI_ROLE_DEFINITION, UI_TABLE_FEED } from 'src/app/global/models';
import { DealerService, FeedService } from 'src/app/global/services';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { CreateFeedComponent } from '../create-feed/create-feed.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'app-edit-feed',
    templateUrl: './edit-feed.component.html',
    styleUrls: ['./edit-feed.component.scss'],
    providers: [TitleCasePipe],
})
export class EditFeedComponent implements OnInit, OnDestroy {
    current_user_role = this._currentUserRole;
    dealer_name: string;
    dealers: API_DEALER[];
    dealers_data: API_DEALER[] = [];
    edit_feed_form: FormGroup;
    filtered_options: Observable<any[]>;
    has_selected_dealer_id = false;
    is_current_user_dealer = this.current_user_role === 'dealer';
    is_current_user_dealer_admin = this.current_user_role === 'dealeradmin';
    is_form_ready = false;
    is_invalid_url = true;
    is_dealer = false;
    is_search = false;
    is_widget_feed = false;
    is_loading_dealers = true;
    isUrlValidType: boolean;
    is_validating_url = false;
    loading_search = false;
    onEditUrl = false;
    paging: PAGING;

    private is_current_user_admin = this.current_user_role === 'administrator';
    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: UI_TABLE_FEED,
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<CreateFeedComponent>,
        private _dealer: DealerService,
        private _form: FormBuilder,
        private _feed: FeedService,
    ) {}

    ngOnInit() {
        this.initializeForm();
        if (this.is_current_user_dealer) this.setDealerData();
        if (this.is_current_user_admin || this.is_current_user_dealer_admin) this.setAdminData();
    }

    dealerSelected(data: string) {
        const control = this.edit_feed_form.get('dealerId');
        control.setValue(data, { emitEvent: false });
        this.has_selected_dealer_id = true;
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    saveFeed() {
        this._feed
            .edit_feed(this.edit_feed_form.value)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this._dialog_ref.close(data);
                    this.showConfirmationDialog('success', 'Feed Saved Successfully', 'Click OK to continue');
                },
                (error) => {
                    this.showConfirmationDialog('error', 'Error while saving feed', error.error.message);
                },
            );
    }

    searchData(keyword: string) {
        this.loading_search = true;
        if (!keyword || keyword.trim().length === 0) this.has_selected_dealer_id = false;
        this.edit_feed_form.get('dealerId').setValue(null, { emitEvent: false });
        this.dealer_name = keyword;

        this._dealer
            .get_search_dealer(keyword)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (data.paging.entities.length > 0) {
                    this.dealers = data.paging.entities;
                    this.dealers_data = data.paging.entities;
                    this.loading_search = false;
                } else {
                    this.dealers_data = [];
                    this.loading_search = false;
                }

                this.paging = data.paging;
            });
    }

    private getDealers(page: number) {
        this.is_loading_dealers = true;

        this._dealer
            .get_dealers_with_page(page, '')
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.paging = response.paging;

                if (page > 1) {
                    this.dealers = this.dealers.concat(response.dealers);
                    this.is_loading_dealers = false;
                    return;
                }

                if (this.is_search) this.loading_search = true;
                this.dealers = response.dealers;
                this.dealers_data = response.dealers;
                this.is_loading_dealers = false;
                this.loading_search = false;
            });
    }

    private initializeForm() {
        const setDealerId = () => {
            const roleId = this._auth.current_user_value.role_id;
            const currentUserBusinessName = this._auth.current_user_value.roleInfo.businessName;
            const businessNameData = this._dialog_data.business_name as { id: string };
            const dealerId = roleId === UI_ROLE_DEFINITION.dealer ? currentUserBusinessName : businessNameData.id;
            return dealerId === '--' ? null : dealerId;
        };

        const feedIdData = this._dialog_data.id as { value: string };
        const feedTitleData = this._dialog_data.title as { value: string };
        const feedDescriptionData = this._dialog_data.description as { value: string };
        const feedType = this._dialog_data.classification as { value: string };
        const dealerId = setDealerId;

        this.edit_feed_form = this._form.group({
            contentId: [feedIdData.value, Validators.required],
            feedTitle: [feedTitleData.value, Validators.required],
            feedDescription: [feedDescriptionData.value],
            dealerId: [dealerId, { disabled: true }],
            classification: [feedType.value.toLowerCase()],
        });

        this.is_form_ready = true;

        if (feedType.value.toLowerCase() === 'widget') {
            this.is_widget_feed = true;
            const embeddedScriptData = this._dialog_data.embeddedScript as { value: string };
            const decodedScript = decodeURIComponent(embeddedScriptData.value.replace(/\+/g, ' '));
            const embeddedScriptControl = new FormControl(decodedScript, Validators.required);
            this.edit_feed_form.addControl('embeddedScript', embeddedScriptControl);
            this.onEditUrl = false;
            this.is_invalid_url = false;
            this.isUrlValidType = false;
            return;
        }

        const feedUrlData = this._dialog_data.feed_url as { link: string };
        const feedUrlControl = new FormControl(feedUrlData.link, Validators.required);
        this.edit_feed_form.addControl('feedUrl', feedUrlControl);
        this.is_invalid_url = this.urlCheck(feedUrlControl.value);
        this.subscribeToFeedUrlChanges();
    }

    private setDealerData() {
        this.is_dealer = true;
        this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
        this.is_loading_dealers = false;
    }

    private setAdminData() {
        const businessNameData = this._dialog_data.business_name as { id: string; value: string };
        this.dealer_name = businessNameData.value;
        this.has_selected_dealer_id = true;
        this.getDealers(1);
    }

    private showConfirmationDialog(status: string, message: string, data: string) {
        const dialogData = { status, message, data };
        const dialogConfig = { width: '500px', height: '350px', data: dialogData };
        this._dialog.open(ConfirmationModalComponent, dialogConfig);
    }

    private subscribeToFeedUrlChanges() {
        const form = this.edit_feed_form;
        const control = form.get('feedUrl');

        form.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe(async () => {
            if (this.is_widget_feed) return;
            this.is_validating_url = true;
            this.onEditUrl = true;
            const url = control.value as string;
            this.is_invalid_url = !(await this._feed.check_url(url));
            this.isUrlValidType = this._feed.isUrlValid;
            this.is_validating_url = false;
        });
    }

    private urlCheck(data: string) {
        if (typeof data === 'undefined' || !data || data.trim().length <= 0) return true;
        const protocols = ['http://', 'https://'];
        const hasProtocol = protocols.some((p) => data.includes(p));
        if (!hasProtocol) return true;
        return false;
    }

    protected get _currentUserRole() {
        return this._auth.current_role;
    }
}
