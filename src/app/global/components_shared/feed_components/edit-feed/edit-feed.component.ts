import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TitleCasePipe } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';

import {
    API_DEALER,
    PAGING,
    UI_AUTOCOMPLETE_INITIAL_DATA,
    UI_ROLE_DEFINITION,
    UI_TABLE_FEED,
} from 'src/app/global/models';
import { DealerService, FeedService } from 'src/app/global/services';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { CreateFeedComponent } from '../create-feed/create-feed.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-edit-feed',
    templateUrl: './edit-feed.component.html',
    styleUrls: ['./edit-feed.component.scss'],
    providers: [TitleCasePipe],
})
export class EditFeedComponent implements OnInit, OnDestroy {
    currentUserRole = this._currentUserRole;
    dealer_name: string;
    dealers: API_DEALER[];
    dealers_data: API_DEALER[] = [];
    edit_feed_form: FormGroup;
    filtered_options: Observable<any[]>;
    feedUrlHasValue = true;
    hasSelectedDealerId = false;
    isCurrentUserDealer = this.currentUserRole === 'dealer';
    isCurrentUserDealerAdmin = this.currentUserRole === 'dealeradmin';
    isDirectTechUrl = false;
    is_form_ready = false;
    isInvalidUrl = false;
    is_dealer = false;
    is_search = false;
    is_widget_feed = false;
    is_loading_dealers = true;
    isUrlValidType: boolean;
    isValidatingUrl = false;
    loading_search = false;
    paging: PAGING;
    selectedDealer: UI_AUTOCOMPLETE_INITIAL_DATA[] = [];

    private is_current_user_admin = this.currentUserRole === 'administrator';
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
        if (this.isCurrentUserDealer) this.setDealerData();
        if (this.is_current_user_admin || this.isCurrentUserDealerAdmin) this.setAdminData();
    }

    public dealerSelected(data: UI_AUTOCOMPLETE_INITIAL_DATA | null): void {
        const control = this.edit_feed_form.get('dealerId');
        if (data) {
            control.setValue(data.id, { emitEvent: false });
            this.hasSelectedDealerId = true;
            this.selectedDealer = [data];
        } else {
            control.setValue(null, { emitEvent: false });
            this.hasSelectedDealerId = false;
            this.selectedDealer = [];
        }
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
        if (!keyword || keyword.trim().length === 0) this.hasSelectedDealerId = false;
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
            const businessNameData = this._dialog_data.business_name as { id: string; value: string };
            const dealerId = roleId === UI_ROLE_DEFINITION.dealer ? currentUserBusinessName : businessNameData.id;
            return dealerId === '--' ? null : dealerId;
        };

        const feedIdData = this._dialog_data.id as { value: string };
        const feedTitleData = this._dialog_data.title as { value: string };
        const feedDescriptionData = this._dialog_data.description as { value: string };
        const feedType = this._dialog_data.classification as { value: string };
        const dealerId = setDealerId();

        this.edit_feed_form = this._form.group({
            contentId: [feedIdData.value, Validators.required],
            feedTitle: [feedTitleData.value, Validators.required],
            feedDescription: [feedDescriptionData.value],
            dealerId: [{ value: dealerId, disabled: this.isCurrentUserDealer }, Validators.required],
            classification: [feedType.value.toLowerCase()],
        });

        this.is_form_ready = true;

        this.hasSelectedDealerId = !!dealerId;

        if (feedType.value.toLowerCase() === 'widget') {
            this.is_widget_feed = true;
            const embeddedScriptData = this._dialog_data.embeddedScript as { value: string };
            const decodedScript = decodeURIComponent(embeddedScriptData.value.replace(/\+/g, ' '));
            const embeddedScriptControl = new FormControl(decodedScript, Validators.required);
            this.edit_feed_form.addControl('embeddedScript', embeddedScriptControl);
            this.isInvalidUrl = false;
            this.isUrlValidType = false;
            return;
        }

        const feedUrlData = this._dialog_data.feed_url as { link: string };
        const feedUrlControl = new FormControl(feedUrlData.link, Validators.required);
        this.edit_feed_form.addControl('feedUrl', feedUrlControl);
        this.isInvalidUrl = this.urlCheck(feedUrlControl.value);
        this.subscribeToFeedUrlChanges();

        if (dealerId) {
            this.selectedDealer = [
                {
                    id: dealerId,
                    value: this.isCurrentUserDealer
                        ? this._auth.current_user_value.roleInfo.businessName
                        : (this._dialog_data.business_name as { value: string }).value,
                },
            ];
        }
    }
    private setDealerData() {
        this.is_dealer = true;
        this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
        this.is_loading_dealers = false;
    }

    private setAdminData() {
        const businessNameData = this._dialog_data.business_name as { id: string; value: string };
        this.dealer_name = businessNameData.value;
        this.hasSelectedDealerId = true;
        this.getDealers(1);

        this.selectedDealer.push({
            id: businessNameData.id,
            value: businessNameData.value,
        });
    }

    private showConfirmationDialog(status: string, message: string, data: string) {
        const dialogData = { status, message, data };
        const dialogConfig = { width: '500px', height: '350px', data: dialogData };
        this._dialog.open(ConfirmationModalComponent, dialogConfig);
    }

    private subscribeToFeedUrlChanges() {
        const form = this.edit_feed_form;
        const control = form.get('feedUrl');

        this.isDirectTechUrl = control.value.includes('directech');

        const url = control.value as string;
        this.isInvalidUrl = !this._feed.check_url(url);

        form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(async (res) => {
            if (this.is_widget_feed) return;
            this.feedUrlHasValue = res.feedUrl ? true : false;
            this.isDirectTechUrl = res.feedUrl.includes('directech');

            this.isValidatingUrl = true;
            const url = control.value as string;
            this.isInvalidUrl = !(await this._feed.check_url(url));
            this.isValidatingUrl = false;
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

    public get isSubmitDisabled(): boolean {
        return (
            this.isInvalidUrl ||
            !this.feedUrlHasValue ||
            this.isValidatingUrl ||
            !this.hasSelectedDealerId ||
            this.edit_feed_form.invalid
        );
    }
}
