import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_CONTENT, FormField, NEWS_FEED_STYLE_DATA } from 'src/app/global/models';
import { FeedService, HelperService } from 'src/app/global/services';
import { FeedMediaComponent } from '../feed-media/feed-media.component';

@Component({
    selector: 'app-news-form',
    templateUrl: './news-form.component.html',
    styleUrls: ['./news-form.component.scss'],
})
export class NewsFormComponent implements OnInit, OnDestroy {
    @Input() selected_dealer: string;
    @Input() edit_news_data: NEWS_FEED_STYLE_DATA;
    @Output() news_feed_data: EventEmitter<any> = new EventEmitter();

    public canAccessUrl = false;
    public checkFeedUrlText = 'Checking url...';
    public feedUrlHasValue: boolean = false;
    public hasValidUrlFormat: boolean = false;
    public isCheckingUrl: boolean = false;
    public isMarking: boolean = false;
    public isInitialUrlCheck: boolean = true;
    public newsFormFields: FormField[] = this._createFormFields;
    public newsForm: FormGroup;
    protected ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _feed: FeedService,
        private _helper: HelperService,
    ) {}

    ngOnInit() {
        this.initializeForm();
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Retrieves the controls of the `newsForm` form group.
     * This getter is used to access individual form controls.
     *
     * @public
     * @returns {{[key: string]: AbstractControl}} - Returns the form controls object.
     */
    public get formControls(): { [key: string]: AbstractControl } {
        return this.newsForm.controls;
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
    public get isFormInvalid(): boolean {
        return this.newsForm.invalid || this.isCheckingUrl || !this.feedUrlHasValue || !this.hasValidUrlFormat;
    }

    /**
     * Sets the value of a specified form control to a given color value.
     *
     * @param {string} color - The color value to set.
     * @param {string} form_control_name - The name of the form control to update.
     * @public
     * @returns {void}
     */
    public setColor(color: string, form_control_name: string): void {
        this.newsForm.get(form_control_name).setValue(color);
    }

    /**
     * Opens the media library modal for selecting media to assign to a form control.
     * Once the media is selected, it updates the respective form control and its display fields (imageUri, fileName).
     *
     * @param {string} form_control_name - The name of the form control to update with the selected media.
     * @public
     * @returns {void}
     */
    public openMediaLibraryModal(form_control_name: string): void {
        const config: MatDialogConfig = {
            width: '1024px',
            data: {
                dealer: this.selected_dealer,
                singleSelect: true,
            },
        };

        this._dialog
            .open(FeedMediaComponent, config)
            .afterClosed()
            .subscribe((data: API_CONTENT[]) => {
                if (data && data.length > 0) {
                    this.newsForm.controls[form_control_name].setValue(data[0].contentId);

                    this.newsFormFields.map((i) => {
                        if (i.formControlName === form_control_name) {
                            i.imageUri = data[0].thumbnail;
                            i.fileName = data[0].title;
                        }
                    });
                }
            });
    }

    /**
     * Emits the current news form data to the parent component.
     * It encodes the RSS feed URL and triggers the `news_feed_data` event.
     *
     * @public
     * @returns {void}
     */
    public generateNewsFeed(): void {
        const feedUrl = this.newsForm.value.rssFeedUrl;
        this.newsForm.value.rssFeedUrl = encodeURIComponent(feedUrl);
        this.news_feed_data.emit(this.newsForm.value);
    }

    /**
     * Removes the selected media from the specified form control and resets its associated display fields (fileName, imageUri).
     *
     * @param {string} control - The name of the form control to reset.
     * @public
     * @returns {void}
     */
    public removeSelectedMedia(control: string): void {
        this.newsForm.controls[control].reset();

        this.newsFormFields.map((i) => {
            if (i.formControlName === control) {
                i.fileName = '';
                i.imageUri = '';
            }
        });
    }

    /**
     * Prepares the form structure by looping through `newsFormFields` and configuring each form control with its validators.
     * If editing existing news data, it sets the form data accordingly.
     * Subscribes to feed URL changes for live validation.
     *
     * @private
     * @returns {void}
     */
    private initializeForm(): void {
        const formConfig = {};

        // Loop through the form fields object and prepare for group
        this.newsFormFields.forEach((field) => {
            const validators: Validators[] = [];

            if (field.required) validators.push(Validators.required);
            if (field.viewType === 'colorpicker') validators.push(this._feed.validateColorFieldValues.bind(this));
            if (field.formControlName === 'results') validators.push(Validators.max(10));

            Object.assign(formConfig, {
                [field.formControlName]: [field.value ? field.value : null, validators],
            });
        });

        // Assign the form data to the newsForm form group object
        this.newsForm = this._form.group(formConfig);

        // Set the form data if the session is currently for editing the form
        if (this.edit_news_data) this.setFormDataForEdit();

        // Watch for changes on the feed url field
        this.subscribeToFeedUrlChanges();
    }

    /**
     * Populates the form fields with existing data when editing a news entry.
     * This function updates the form with values from `edit_news_data`, setting image URIs, file names,
     * color picker values, and other form controls like background, font size, margins, and RSS feed URL.
     * It also triggers URL validation for the existing RSS feed.
     *
     * @private
     * @returns {void}
     */
    private setFormDataForEdit(): void {
        this.newsFormFields.map((i) => {
            if (i.viewType == 'upload' && this.edit_news_data[i.apiReferenceKey]) {
                i.imageUri = `${this.edit_news_data[i.apiReferenceKey].url}${this.edit_news_data[i.apiReferenceKey].fileName}`;
                i.fileName = this.edit_news_data[i.apiReferenceKey].title;
            }

            if (i.viewType == 'colorpicker') i.colorValue = this.edit_news_data[i.formControlName];
        });

        // Validate the existing feed url
        const url = this.edit_news_data.rssFeedUrl;
        this.isCheckingUrl = true;
        this.checkUrlFormat(url);

        this.formControls.backgroundContentId.setValue(this.edit_news_data.backgroundContentId);
        this.formControls.backgroundColor.setValue(this.edit_news_data.backgroundColor);
        this.formControls.fontColor.setValue(this.edit_news_data.fontColor);
        this.formControls.fontSize.setValue(this.edit_news_data.fontSize);
        this.formControls.loopCycle.setValue(this.edit_news_data.loopCycle);
        this.formControls.marginLeft.setValue(this.edit_news_data.marginLeft);
        this.formControls.marginTop.setValue(this.edit_news_data.marginTop);
        this.formControls.results.setValue(this.edit_news_data.results);
        this.formControls.rssFeedUrl.setValue(url);
        this.formControls.time.setValue(this.edit_news_data.time);
    }

    /**
     * Subscribes to changes in the `rssFeedUrl` form control and debounces user input.
     * Each time the RSS feed URL is modified, the URL is validated after a 300ms delay to prevent rapid validations.
     * During validation, a loading flag (`isCheckingUrl`) is set to true. The subscription is automatically unsubscribed
     * when the component is destroyed.
     *
     * @private
     * @returns {void}
     */
    private subscribeToFeedUrlChanges(): void {
        const control = this.formControls.rssFeedUrl;

        control.valueChanges
            .pipe(
                debounceTime(300),
                tap(() => (this.isCheckingUrl = true)),
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe(
                (response) => {
                    // Remove the flag that prevents the url check messages to apepar on initial load
                    this.isInitialUrlCheck = false;
                    this.checkUrlFormat(response);
                },
                (err) => {
                    console.error('Error while processing the url', err);
                    this.isCheckingUrl = false;
                },
            );
    }

    /**
     * Validates the provided URL by checking if it has a value and is structured correctly.
     * The function first checks if the URL is non-empty and well-formed using helper methods.
     * If the URL is valid, it proceeds to check its accessibility using `checkUrlAccess`.
     * If the URL is not valid, the validation process is stopped, and `isCheckingUrl` is set to false.
     *
     * @private
     * @param {string} data - The URL to validate.
     * @returns {void}
     */
    private checkUrlFormat(data: string): void {
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
                takeUntil(this.ngUnsubscribe),
                tap(() => (this.isCheckingUrl = true)),
            )
            .subscribe(
                () => {
                    this.isCheckingUrl = false;
                    this.canAccessUrl = true;
                },
                (err) => {
                    this.canAccessUrl = false;
                    this.isCheckingUrl = false;
                    console.error('Failed to validate url access', err);
                },
            );
    }

    /**
     * Returns the form fields configuration for creating the news form.
     * This includes fields such as background image, colors, font size, and RSS feed URL.
     *
     * @protected
     * @returns {FormField[]} - An array of form field configuration objects.
     */
    protected get _createFormFields(): FormField[] {
        return [
            {
                label: 'Background Image',
                formControlName: 'backgroundContentId',
                type: 'text',
                width: 'col-lg-6',
                viewType: 'upload',
                imageUri: '',
                fileName: '',
                required: false,
                apiReferenceKey: 'backgroundContents',
                options: null,
            },
            {
                label: 'Background Color',
                formControlName: 'backgroundColor',
                type: 'text',
                viewType: 'colorpicker',
                colorValue: '#768fb4',
                width: 'col-lg-6',
                required: true,
                value: '#768fb4',
                options: null,
            },
            {
                label: 'Font Color',
                formControlName: 'fontColor',
                type: 'text',
                viewType: 'colorpicker',
                colorValue: '#000000',
                width: 'col-lg-3',
                required: true,
                value: '#000000',
                options: null,
            },
            {
                label: 'Font Size',
                formControlName: 'fontSize',
                errorMsg: '',
                type: 'number',
                width: 'col-lg-3',
                required: false,
                value: 44,
                options: null,
            },
            {
                label: 'Offset Left',
                formControlName: 'marginLeft',
                errorMsg: '',
                type: 'number',
                width: 'col-lg-3',
                required: false,
                value: 10,
                options: null,
            },
            {
                label: 'Offset Top',
                formControlName: 'marginTop',
                errorMsg: '',
                type: 'value',
                width: 'col-lg-3',
                required: false,
                value: 23,
                options: null,
            },
            {
                label: 'RSS Feed URL',
                formControlName: 'rssFeedUrl',
                errorMsg: '',
                type: 'text',
                width: 'col-lg-4',
                required: true,
                options: null,
            },
            {
                label: 'Results',
                formControlName: 'results',
                errorMsg: '',
                type: 'number',
                width: 'col-lg',
                required: false,
                value: 3,
                options: null,
            },
            {
                label: 'Transition Time',
                formControlName: 'time',
                errorMsg: '',
                type: 'number',
                width: 'col-lg',
                required: false,
                value: 8,
                options: null,
            },
            {
                label: 'Loop Cycle',
                formControlName: 'loopCycle',
                errorMsg: '',
                type: 'number',
                width: 'col-lg',
                required: false,
                value: 9,
                options: null,
            },
        ];
    }
}
