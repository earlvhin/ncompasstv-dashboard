import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { startWith, map, takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { DealerService, FeedService } from 'src/app/global/services';
import { API_CREATE_FEED, API_DEALER, CREATE_WIDGET_FEED, PAGING } from 'src/app/global/models';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-create-feed',
    templateUrl: './create-feed.component.html',
    styleUrls: ['./create-feed.component.scss'],
})
export class CreateFeedComponent implements OnInit, OnDestroy {
    @Output() reload_page = new EventEmitter();
    create_feed_fields = this._formFields;
    dealer_id: string;
    dealer_name: string;
    dealers: API_DEALER[];
    dealers_data: Array<any> = [];
    selectedDealer: any = [];
    disabledSubmit = true;
    feedUrlHasValue = false;
    filtered_options: Observable<any[]>;
    hasLoadedDealers = false;
    isInvalidUrl = false;
    isDirectTechUrl = false;
    has_selected_dealer_id = false;
    has_selected_widget_feed_type = false;
    isCurrentUserDealer = this._isDealer;
    is_current_user_admin = this._isAdmin;
    is_current_user_dealer_admin = this._isDealerAdmin;
    isCreatingFeed = false;
    is_search = false;
    isUrlValidType = false;
    isValidatingUrl = false;
    feed_types = this._feedTypes;
    loading_data = true;
    loading_search = false;
    new_feed_form: FormGroup;
    paging: PAGING;

    private selected_dealer_id: string;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<CreateFeedComponent>,
        private _feed: FeedService,
        private _form: FormBuilder,
    ) {}

    ngOnInit() {
        this.initializeForm();

        if (this.isCurrentUserDealer) {
            this.isCurrentUserDealer = true;
            this.hasLoadedDealers = true;
            this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
            this.selected_dealer_id = this.dealer_id;
            this.dealer_name = this._auth.current_user_value.roleInfo.businessName;

            this.selectedDealer.push({
                id: this.dealer_id,
                value: this.dealer_name,
            });

            return;
        }

        this.getDealers(1);
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    dealerSelected(data: { id: string; value: string }) {
        this.selected_dealer_id = data.id;
        this.has_selected_dealer_id = true;
    }

    searchData(keyword: string) {
        this.loading_search = true;
        if (!keyword || keyword.trim().length === 0) this.has_selected_dealer_id = false;

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

    saveFeed() {
        this.isCreatingFeed = true;

        const feedType = this.new_feed_form.get('feedType').value;

        if (feedType.toLowerCase() === 'widget') return this.createWidgetFeed();

        const new_feed = new API_CREATE_FEED(
            this.form_controls.feedTitle.value,
            this.form_controls.feedDescription.value,
            this.form_controls.feedUrl.value,
            this.selected_dealer_id || null,
            this._auth.current_user_value.user_id,
            this.form_controls.feedType.value,
        );

        this._feed
            .create_feed([new_feed])
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this._dialog_ref.close(data);
                    this.reload_page.emit(true);
                    this.showConfirmationDialog('success', 'Feed Saved Successfully', 'Click OK to continue');
                },
                (error) => {
                    this.showConfirmationDialog('error', 'Error while saving feed', error.error.message);
                },
            );
    }

    searchBoxTrigger(event: { is_search: boolean; page: number }) {
        this.is_search = event.is_search;
        this.getDealers(event.page);
    }

    private showConfirmationDialog(status: string, message: string, data: string) {
        const dialogData = { status, message, data };
        const dialogConfig = { width: '500px', height: '350px', data: dialogData };
        this._dialog.open(ConfirmationModalComponent, dialogConfig);
    }

    private createWidgetFeed() {
        const { feedTitle, feedDescription, embeddedscript } = this.new_feed_form.value;
        const dealerId = this.selected_dealer_id || null;
        const createdBy = this._auth.current_user_value.user_id;
        const classification = 'widget';

        const body: CREATE_WIDGET_FEED = {
            feedTitle,
            feedDescription,
            embeddedscript,
            dealerId,
            createdBy,
            classification,
        };

        this._feed
            .create_widget_feed(body)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this._dialog_ref.close(response);
                    this.reload_page.emit(true);
                    this.showConfirmationDialog('success', 'Feed Saved Successfully', 'Click OK to continue');
                },
                (e) => {
                    throw new Error(e);
                },
            );
    }

    private filterAutoCompleteChanges(value): any {
        const filterValue = value.toLowerCase();
        const returnValue = this.dealers.filter((d) => d.businessName.toLowerCase().indexOf(filterValue) === 0);
        if (returnValue.length == 0) this.selected_dealer_id = undefined;
        return returnValue;
    }

    private get form_controls() {
        return this.new_feed_form.controls;
    }

    private getDealers(page: number) {
        this.loading_data = true;

        this._dealer
            .get_dealers_with_page(page, '')
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                this.paging = data.paging;

                if (page > 1) {
                    this.dealers = this.dealers.concat(data.dealers);
                    this.loading_data = false;
                    return;
                }

                if (this.is_search) this.loading_search = true;
                this.dealers = data.dealers;
                this.dealers_data = data.dealers;
                this.subscribeToAutoCompleteChanges();
                this.hasLoadedDealers = true;
                this.loading_search = false;
                this.loading_data = false;
            });
    }

    private initializeForm() {
        this.new_feed_form = this._form.group({
            feedTitle: [null, Validators.required],
            feedDescription: [null],
            feedUrl: [null, Validators.required],
            assignTo: [null],
            feedType: [this.feed_types[0].id, Validators.required],
            embeddedscript: [null],
        });

        this.subscribeToFeedTypeChanges();
        this.subscribeToFeedUrlChanges();
    }

    // Autocomplete beyond this point
    private subscribeToAutoCompleteChanges() {
        this.filtered_options = this.form_controls.assignTo.valueChanges.pipe(
            startWith(''),
            map((value) => this.filterAutoCompleteChanges(value)),
        );
    }

    private subscribeToFeedTypeChanges() {
        const form = this.new_feed_form;
        const feedTypeControl = form.get('feedType');
        const feedUrlControl = form.get('feedUrl');
        const embeddedScriptControl = form.get('embeddedscript');

        const setControlAsRequired = (control: AbstractControl) => {
            control.setValidators(Validators.required);
            control.setErrors(null);
            control.updateValueAndValidity({ emitEvent: false });
        };

        const setControlAsNotRequired = (control: AbstractControl) => {
            control.clearValidators();
            control.setErrors(null);
            control.updateValueAndValidity({ emitEvent: false });
        };

        // put distinctUntilChanged() here because for some reason, this fires A LOT which crashes the script
        feedTypeControl.valueChanges
            .pipe(takeUntil(this._unsubscribe), distinctUntilChanged())
            .subscribe((type: string) => {
                this.has_selected_widget_feed_type = type === 'widget';

                if (this.has_selected_widget_feed_type) {
                    setControlAsRequired(embeddedScriptControl);
                    setControlAsNotRequired(feedUrlControl);
                    return;
                }

                setControlAsRequired(feedUrlControl);
                setControlAsNotRequired(embeddedScriptControl);
            });
    }

    private subscribeToFeedUrlChanges() {
        const control = this.new_feed_form.get('feedUrl');

        control.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(async (response) => {
            this.feedUrlHasValue = response ? true : false;

            this.isDirectTechUrl = response.includes('directech');

            this.isValidatingUrl = true;
            const url = response as string;
            this.isInvalidUrl = !(await this._feed.check_url(url));
            this.isValidatingUrl = false;
        });
    }

    protected get _feedTypes() {
        return [
            {
                name: 'News',
                id: 'news',
                checked: true,
            },
            {
                name: 'Weather',
                id: 'weather',
                checked: false,
            },
            {
                name: 'Filler',
                id: 'filler',
                checked: false,
            },
            {
                name: 'Live Stream',
                id: 'live_stream',
                checked: false,
            },
            {
                name: 'Widget',
                id: 'widget',
                checked: false,
            },
        ];
    }

    protected get _formFields() {
        return [
            {
                label: 'Feed Title *',
                control: 'feedTitle',
                placeholder: 'Ex: ESPN News',
                type: 'text',
            },
            {
                label: 'Feed Description (Optional)',
                control: 'feedDescription',
                placeholder: 'Ex: ESPN Latest News Today',
                type: 'text',
            },
            {
                label: 'Assign To (Optional)',
                control: 'assignTo',
                placeholder: 'Type in a Dealer Business Name',
                type: 'text',
                is_autocomplete: true,
            },
            {
                label: 'Feed URL *',
                control: 'feedUrl',
                placeholder: 'Feed URL',
                type: 'text',
            },
            {
                label: 'Feed Type *',
                control: 'feedType',
                placeholder: 'Feed Type',
                type: 'option',
            },
        ];
    }

    protected get _isAdmin() {
        return this._auth.current_role === 'administrator';
    }

    protected get _isDealer() {
        const DEALER_ROLES = ['dealer', 'sub-dealer'];
        return DEALER_ROLES.includes(this._auth.current_role);
    }

    protected get _isDealerAdmin() {
        return this._auth.current_role === 'dealeradmin';
    }
}
