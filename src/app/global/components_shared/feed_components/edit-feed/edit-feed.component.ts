import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TitleCasePipe } from '@angular/common';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// models
import {
    API_DEALER,
    PAGING,
    UI_AUTOCOMPLETE_INITIAL_DATA,
    UI_ROLE_DEFINITION_TEXT,
    UI_TABLE_FEED,
    UI_TABLE_FEED_DEALER,
    UPSERT_WIDGET_FEED,
} from 'src/app/global/models';

// services
import { AuthService, DealerService, FeedService } from 'src/app/global/services';

// components
import { CreateFeedComponent } from '../create-feed/create-feed.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-edit-feed',
    templateUrl: './edit-feed.component.html',
    styleUrls: ['./edit-feed.component.scss'],
    providers: [TitleCasePipe],
})
export class EditFeedComponent implements OnInit, OnDestroy {
    dealers: API_DEALER[];
    editFeedForm: FormGroup;
    feedUrlHasValue = true;
    isDirectTechUrl = false;
    isFormReady = false;
    isInvalidUrl = false;
    isWidgetFeed = false;
    isLoadingDealers = true;
    isUrlValidType: boolean;
    isValidatingUrl = false;
    paging: PAGING;
    selectedDealers: UI_AUTOCOMPLETE_INITIAL_DATA[] = [];
    hasSelectedDealer = true;

    private dealerName: string;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: UI_TABLE_FEED | UI_TABLE_FEED_DEALER,
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<CreateFeedComponent>,
        private _dealer: DealerService,
        private _form: FormBuilder,
        private _feed: FeedService,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.setUserData();
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Handles the selection of a dealer from an autocomplete input.
     * Updates the `dealerId` form control and manages the state of selected dealers.
     *
     * @param {UI_AUTOCOMPLETE_INITIAL_DATA | null} data - The data object representing the selected dealer or null if no dealer is selected.
     * @returns {void}
     */
    public dealerSelected(data: UI_AUTOCOMPLETE_INITIAL_DATA | null): void {
        const control = this.editFeedForm.get('dealerId');
        const hasNoData = typeof data === 'undefined' || !data;
        const controlValue = hasNoData ? null : data.id;
        control.setValue(controlValue, { emitEvent: false });
        this.selectedDealers = hasNoData ? [] : [data];
        this.hasSelectedDealer = !hasNoData;
    }

    /**
     * Checks whether the changes to a non-widget feed being edited can be submitted.
     *
     * @returns {boolean}
     *
     */
    public get invalidFeedData(): boolean {
        return (
            this.isInvalidUrl ||
            !this.feedUrlHasValue ||
            this.isValidatingUrl ||
            this.isLoadingDealers ||
            !this.hasSelectedDealer
        );
    }

    /**
     * Checks whether the changes to a widget feed being edited can be submitted.
     *
     * @returns {boolean}
     *
     */
    public get invalidWidgetData(): boolean {
        return this.editFeedForm.invalid || this.isLoadingDealers || !this.hasSelectedDealer;
    }

    /**
     * Checks if the currently logged in user has the dealer role
     *
     * @returns {boolean}
     */
    public get isDealerUser(): boolean {
        return this.currentUserRole === UI_ROLE_DEFINITION_TEXT.dealer;
    }

    /**
     * Checks if the currently logged in user has the dealer admin role
     *
     * @returns {boolean}
     */
    private get isDealerAdminUser(): boolean {
        return this.currentUserRole === UI_ROLE_DEFINITION_TEXT.dealeradmin;
    }

    /**
     * Checks if the currently logged in user has the administrator role
     *
     * @returns {boolean}
     */
    private get isAdminUser(): boolean {
        return this.currentUserRole === UI_ROLE_DEFINITION_TEXT.administrator;
    }

    /**
     * Calls the functions that set the user data based on the role of the user currently logged in
     *
     * @returns {void}
     */
    private setUserData(): void {
        if (this.isDealerUser) {
            this.setDealerData();
            return;
        }

        if (this.isAdminUser || this.isDealerAdminUser) {
            this.setAdminData();
            return;
        }
    }

    /**
     * Saves the current feed data by updating the widget feed.
     * The data is retrieved from the form and sent to the server using the `updateWidgetFeed` method.
     * Upon success, the dialog is closed, and a confirmation dialog is shown.
     * In case of an error, an error dialog is displayed.
     *
     * @returns {void}
     */
    public saveFeed(): void {
        const feedData = this.editFeedForm.value as UPSERT_WIDGET_FEED;

        this._feed
            .updateWidgetFeed(feedData)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (res) => {
                    this._dialog_ref.close(res);
                    this.showConfirmationDialog('success', 'Feed Saved Successfully', 'Click OK to continue');
                },
                error: (e) => {
                    this.showConfirmationDialog('error', 'Failed to update the widget feed!', e.error.message);
                },
            });
    }

    private getDealers(page: number): void {
        this.isLoadingDealers = true;

        this._dealer
            .get_dealers_with_page(page, '')
            .pipe(
                takeUntil(this.ngUnsubscribe),
                finalize(() => (this.isLoadingDealers = false)),
            )
            .subscribe((response) => {
                this.paging = response.paging;

                if (page > 1) {
                    this.dealers = this.dealers.concat(response.dealers);
                    return;
                }

                this.dealers = response.dealers;
            });
    }

    /**
     * Initializes the form for editing the feed
     *
     * @returns {void}
     */
    private initializeForm(): void {
        const feedIdData = this._dialog_data.id as { value: string };
        const feedTitleData = this._dialog_data.title as { value: string };
        const feedDescriptionData = this._dialog_data.description as { value: string };
        const feedType = this._dialog_data.classification as { value: string };
        const dealerId = this.getDealerId();

        // set the form
        this.editFeedForm = this._form.group({
            contentId: [feedIdData.value, Validators.required],
            feedTitle: [feedTitleData.value, Validators.required],
            feedDescription: [feedDescriptionData.value],
            dealerId: [dealerId, { disabled: true }, Validators.required],
            classification: [feedType.value.toLowerCase()],
        });

        // informs the template that the form is ready
        this.isFormReady = true;

        // if the feed is of type widget
        // then handle the embedded script form control
        if (feedType.value.toLowerCase() === 'widget') {
            this.handleEmbeddedScriptFormControl();
            return;
        }

        const feedUrlData = this._dialog_data.feed_url as { link: string };
        const feedUrlControl = new FormControl(feedUrlData.link, Validators.required);
        this.editFeedForm.addControl('feedUrl', feedUrlControl);
        this.isInvalidUrl = this.urlCheck(feedUrlControl.value);
        this.subscribeToFeedUrlChanges();
    }

    /**
     * Retrieves the dealer id from the injected dialog data based on the currently logged in user
     *
     * @returns {string}
     */
    private getDealerId(): string {
        if (this.isDealerUser) {
            const dealerFeed = this._dialog_data as UI_TABLE_FEED_DEALER;
            return dealerFeed.dealer_id.value;
        }

        const adminFeed = this._dialog_data as UI_TABLE_FEED;
        return adminFeed.business_name.id;
    }

    /**
     * Handles the data for the widget feed form control
     *
     * @returns {void}
     */
    private handleEmbeddedScriptFormControl(): void {
        this.isWidgetFeed = true;
        const embeddedScriptData = this._dialog_data.embeddedScript as { value: string };
        const decodedScript = this.decodeWidgetScript(embeddedScriptData.value);
        const embeddedScriptControl = new FormControl(decodedScript, Validators.required);
        this.editFeedForm.addControl('embeddedScript', embeddedScriptControl);
        this.isInvalidUrl = false;
        this.isUrlValidType = false;
    }

    /**
     * Decodes the widget script that was encoded before sending to the server
     *
     * @param {string} data
     * @returns {string} Returns the decoded script if it succeeds, else it will return the unencoded script
     */
    private decodeWidgetScript(data: string): string {
        try {
            return decodeURIComponent(data.replace(/\+/g, ' '));
        } catch (error) {
            console.error('Error decoding widget script. Returning string as is...');
            return data;
        }
    }

    private setDealerData(): void {
        this.dealerName = this._auth.current_user_value.roleInfo.businessName;

        // Push the value of the currently logged in dealer user on the autocomplete
        this.selectedDealers.push({ id: this.getDealerId(), value: this.dealerName });

        this.isLoadingDealers = false;
    }

    private setAdminData(): void {
        const dialogData = this._dialog_data as UI_TABLE_FEED;
        const businessNameData = dialogData.business_name as { id: string; value: string };
        this.dealerName = businessNameData.value;

        // Push the value of the currently logged in dealer user on the autocomplete
        this.selectedDealers.push({ id: this.getDealerId(), value: this.dealerName });

        this.getDealers(1);
    }

    private showConfirmationDialog(status: string, message: string, data: string) {
        const dialogData = { status, message, data };
        const dialogConfig = { width: '500px', height: '350px', data: dialogData };
        this._dialog.open(ConfirmationModalComponent, dialogConfig);
    }

    private subscribeToFeedUrlChanges() {
        const form = this.editFeedForm;
        const control = form.get('feedUrl');

        this.isDirectTechUrl = control.value.includes('directech');
        const url = control.value as string;
        this.isInvalidUrl = !this._feed.canAccessUrl(url);

        form.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
            if (this.isWidgetFeed) return;
            this.feedUrlHasValue = res.feedUrl ? true : false;
            this.isDirectTechUrl = res.feedUrl.includes('directech');

            this.isValidatingUrl = true;
            const url = control.value as string;
            this.isInvalidUrl = !this._feed.canAccessUrl(url);
            this.isValidatingUrl = false;
        });
    }

    private urlCheck(data: string): boolean {
        if (typeof data === 'undefined' || !data || data.trim().length <= 0) return true;
        const protocols = ['http://', 'https://'];
        const hasProtocol = protocols.some((p) => data.includes(p));
        if (!hasProtocol) return true;
        return false;
    }

    /**
     * Retrieves the role of the currently logged in user
     *
     * @returns {string}
     */
    protected get currentUserRole(): string {
        return this._auth.current_role.toLowerCase();
    }
}
