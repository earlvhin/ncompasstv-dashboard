import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { startWith, map, takeUntil, distinctUntilChanged, tap, finalize, debounceTime, delay } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

// services
import { AuthService, DealerService, FeedService, HelperService } from 'src/app/global/services';

// models
import { API_CREATE_FEED, API_DEALER, UPSERT_WIDGET_FEED, PAGING } from 'src/app/global/models';

// components
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
    dealerHasValue = false;
    isDirectTechUrl = false;
    has_selected_dealer_id = false;
    has_selected_widget_feed_type = false;
    isCurrentUserDealer = this._isDealer;
    is_current_user_admin = this._isAdmin;
    is_current_user_dealer_admin = this._isDealerAdmin;
    isCreatingFeed = false;
    is_search = false;
    isUrlValidType = false;
    feed_types = this._feedTypes;
    loading_data = true;
    loading_search = false;
    new_feed_form: FormGroup;
    paging: PAGING;

    public canAccessUrl: boolean = false;
    public checkFeedUrlText = 'Checking url...';
    public isCheckingUrl: boolean = false;
    public isInitialUrlCheck: boolean = true;
    public hasValidUrlFormat: boolean = false;
    private selectedDealerId: string;
    private dealerName: string;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<CreateFeedComponent>,
        private _feed: FeedService,
        private _form: FormBuilder,
        private _helper: HelperService,
    ) {}

    ngOnInit() {
        this.initializeForm();

        if (this.isCurrentUserDealer) {
            this.isCurrentUserDealer = true;
            this.hasLoadedDealers = true;
            this.dealerHasValue = true;
            this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
            this.selectedDealerId = this.dealer_id;
            this.dealerName = this._auth.current_user_value.roleInfo.businessName;

            this.selectedDealer.push({
                id: this.dealer_id,
                value: this.dealerName,
            });

            return;
        }

        this.getDealers(1);
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    /**
     * Checks if the URL is valid by verifying that it has a value, is properly formatted, and is accessible.
     *
     * @public
     * @returns {boolean} - Returns `true` if the URL has a value, is in a valid format, and is accessible; otherwise, `false`.
     */
    public get validUrl(): boolean {
        return this.feedUrlHasValue && this.hasValidUrlFormat && this.canAccessUrl;
    }

    /**
     * Checks if the URL is valid but inaccessible by verifying that it has a value, is properly formatted, but cannot be accessed.
     *
     * @public
     * @returns {boolean} - Returns `true` if the URL has a value and is in a valid format but is not accessible; otherwise, `false`.
     */
    public get validUrlNoAccess(): boolean {
        return this.feedUrlHasValue && this.hasValidUrlFormat && !this.canAccessUrl;
    }

    /**
     * Determines the appropriate alert class based on the URL's validation state.
     * - Returns `'alert-success'` if the URL is valid and accessible.
     * - Returns `'alert-danger'` if the URL has no value or is not in a valid format.
     * - Returns `'alert-warning'` if the URL is valid but inaccessible.
     * - Returns an empty string if none of the conditions are met.
     *
     * @public
     * @returns {string} - The alert class string based on the URL validation state.
     *
     */
    public getAlertClass(): string {
        if (this.validUrl) return 'alert-success';
        if (!this.feedUrlHasValue || !this.hasValidUrlFormat) return 'alert-danger';
        if (this.validUrlNoAccess) return 'alert-warning';
        return '';
    }

    public dealerSelected(data: { id: string; value: string }): void {
        if (data == null) {
            this.clearSelectedDealer();
            return;
        }

        this.selectedDealerId = data.id;
        this.has_selected_dealer_id = true;
        this.dealerHasValue = true;
    }

    private clearSelectedDealer(): void {
        this.selectedDealerId = null;
        this.has_selected_dealer_id = false;
        this.dealerHasValue = false;
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
            this.selectedDealerId || null,
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
        const dealerId = this.selectedDealerId || null;
        const createdBy = this._auth.current_user_value.user_id;
        const classification = 'widget';

        const body: UPSERT_WIDGET_FEED = {
            feedTitle,
            feedDescription,
            embeddedScript: embeddedscript,
            dealerId,
            createdBy,
            classification,
        };

        this._feed
            .createWidgetFeed(body)
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
        if (returnValue.length == 0) this.selectedDealerId = undefined;
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
            feedTitle: [null, [Validators.required, this.noWhitespaceValidator]],
            feedDescription: [null],
            feedUrl: [null, [Validators.required, this.noWhitespaceValidator]],
            assignTo: [null],
            feedType: [this.feed_types[0].id, Validators.required],
            embeddedscript: [null],
        });

        this.subscribeToFeedTypeChanges();
        this.subscribeToFeedUrlChanges();
    }

    private noWhitespaceValidator(control: AbstractControl): { [key: string]: boolean } | null {
        const isWhitespace = (control.value || '').trim().length === 0;
        const isValid = !isWhitespace;
        return isValid ? null : { whitespace: true };
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

    private subscribeToFeedUrlChanges(): void {
        const control = this.new_feed_form.get('feedUrl');

        control.valueChanges
            .pipe(
                debounceTime(300),
                tap(() => (this.isCheckingUrl = true)),
                takeUntil(this._unsubscribe),
            )
            .subscribe(
                (response) => {
                    // Remove the flag that prevents the url check messages to apepar on initial load
                    this.isInitialUrlCheck = false;
                    this.checkUrlValue(response);
                },
                (err) => {
                    console.error('Error while processing the url', err);
                    this.isCheckingUrl = false;
                },
            );
    }

    /**
     * Validates the provided URL string by checking if it has a value, is well-structured, and can be accessed.
     * Updates the component's properties (`isCheckingUrl`, `feedUrlHasValue`, and `hasValidUrlFormat`) based on these checks.
     * If the URL is valid and well-structured, it proceeds to check its accessibility.
     *
     * @private
     * @param {string} data - The URL to validate.
     * @returns {void}
     */
    private checkUrlValue(data: string): void {
        this.isCheckingUrl = true;
        this.feedUrlHasValue = this._helper.stringHasValue(data);

        // Do not proceed to if url field has no value
        if (!this.feedUrlHasValue) {
            this.isCheckingUrl = false;
            return;
        }

        this.hasValidUrlFormat = this._feed.isUrlStructured(data);

        // Do not proceed if url is not structured
        if (!this.hasValidUrlFormat) {
            this.isCheckingUrl = false;
            return;
        }

        this.checkUrlAccess(data);
    }

    /**
     * Checks if the provided URL can be accessed by making a request to it.
     * The function subscribes to the result of `canAccessUrl` and sets the `canAccessUrl` flag based on the result.
     * During the process, the `isCheckingUrl` flag is used to indicate that the URL validation is ongoing.
     * If the URL cannot be accessed, an error is logged and the `canAccessUrl` flag is set to false.
     *
     * @private
     * @param {string} data - The URL to check for accessibility.
     * @returns {void}
     */
    private checkUrlAccess(data: string): void {
        this._feed
            .canAccessUrl(data)
            .pipe(
                takeUntil(this._unsubscribe),
                tap(() => (this.isCheckingUrl = true)),
                finalize(() => (this.isCheckingUrl = false)),
            )
            .subscribe(
                () => {
                    this.canAccessUrl = true;
                },
                (err) => {
                    this.canAccessUrl = false;
                    console.error('Failed to validate url access', err);
                },
            );
    }

    /**
     * Determines whether the form is invalid by checking multiple conditions.
     * The form is considered invalid if any of the following are true:
     * - The `new_feed_form` is invalid.
     * - The URL is currently being checked (`isCheckingUrl` is true).
     * - The URL field does not have a value (`feedUrlHasValue` is false).
     * - The URL is not in a valid format (`hasValidUrlFormat` is false).
     * - The dealer field does not have a value (`dealerHasValue` is false).
     *
     * @public
     * @returns {boolean} - Returns `true` if any of the conditions make the form invalid, otherwise `false`.
     *
     */
    public isFormInvalid(): boolean {
        return (
            this.new_feed_form.invalid ||
            this.isCheckingUrl ||
            !this.feedUrlHasValue ||
            !this.hasValidUrlFormat ||
            !this.dealerHasValue
        );
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
