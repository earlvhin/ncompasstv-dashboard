import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_CONTENT, NEWS_FEED_STYLE_DATA } from 'src/app/global/models';
import { FeedService } from 'src/app/global/services';
import { FeedMediaComponent } from '../feed-media/feed-media.component';

@Component({
    selector: 'app-news-form',
    templateUrl: './news-form.component.html',
    styleUrls: ['./news-form.component.scss'],
})
export class NewsFormComponent implements OnInit, OnDestroy {
    @Input() selected_dealer: string;
    @Input() edit_news_data: NEWS_FEED_STYLE_DATA;
    @Output() open_media_library: EventEmitter<any> = new EventEmitter();
    @Output() news_feed_data: EventEmitter<any> = new EventEmitter();

    disabled_submit = true;
    feedUrlHasValue = false;
    isDirectTechUrl = false;
    isInvalidUrl = false;
    is_marking: boolean = false;
    is_validating_url = false;
    isUrlValidType: false;
    news_form_fields = this._createFormFields;
    news_form: FormGroup;
    rss_url_checking: boolean = false;
    rss_url_valid: boolean;
    selected_background_image: string;
    selected_banner_image: string;

    font_family = [{ label: 'Helvetica' }, { label: 'Poppins' }, { label: 'Roboto' }, { label: 'Montserrat' }];

    orientation = [{ label: 'Vertical' }, { label: 'Horizontal' }];

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _form: FormBuilder,
        private _feed: FeedService,
        private _dialog: MatDialog,
    ) {}

    ngOnInit() {
        this.prepareForms();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    /** news Form Control Getter */
    get formControls() {
        return this.news_form.controls;
    }

    /** On Color Picker Field Changed */
    colorPicker(color: string, form_control_name: string) {
        this.news_form.get(form_control_name).setValue(color);
    }

    /** Open Media Library where contents are assigned to selected dealer */
    openMediaLibraryModal(form_control_name: string): void {
        /** Open Feed Media Modal */
        let dialog = this._dialog.open(FeedMediaComponent, {
            width: '1024px',
            data: {
                dealer: this.selected_dealer,
                singleSelect: true,
            },
        });

        /** On Modal Close */
        dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
            if (data && data.length > 0) {
                /** Set Form Control Field Value */
                this.news_form.controls[form_control_name].setValue(data[0].contentId);

                /** Set UI Image Display */
                this.news_form_fields.map((i) => {
                    if (i.form_control_name === form_control_name) {
                        i.imageUri = data[0].thumbnail;
                        i.fileName = data[0].title;
                    }
                });
            }
        });
    }

    /** Pass news feed data to parent component */
    generateNewsFeed() {
        const feedUrl = this.news_form.value.rssFeedUrl;
        this.news_form.value.rssFeedUrl = encodeURIComponent(feedUrl);
        this.news_feed_data.emit(this.news_form.value);
    }

    /** Remove Selected Media File
     * @param {string} control Clicked Upload Control Name
     */
    removeSelectedMedia(control: string) {
        this.news_form.controls[control].reset();

        this.news_form_fields.map((i) => {
            if (i.form_control_name === control) {
                i.fileName = '';
                i.imageUri = '';
            }
        });
    }

    /** Prepare Forms */
    private prepareForms(): void {
        let formConfig = {};

        /** Loop through form fields object and prepare for group */
        this.news_form_fields.map((field) => {
            const validators: any[] = [];

            if (field.required) validators.push(Validators.required);
            if (field.viewType === 'colorpicker') validators.push(this._feed.validateColorFieldValues.bind(this));
            if (field.form_control_name === 'results') validators.push(Validators.max(10));

            Object.assign(formConfig, {
                [field.form_control_name]: [field.value ? field.value : null, validators],
            });
        });

        this.news_form = this._form.group(formConfig);

        if (this.edit_news_data) {
            this.news_form_fields.map((i) => {
                if (i.viewType == 'upload' && this.edit_news_data[i.api_key_ref]) {
                    i.imageUri = `${this.edit_news_data[i.api_key_ref].url}${this.edit_news_data[i.api_key_ref].fileName}`;
                    i.fileName = this.edit_news_data[i.api_key_ref].title;
                }

                if (i.viewType == 'colorpicker') {
                    i.colorValue = this.edit_news_data[i.form_control_name];
                }
            });

            this.formControls.backgroundContentId.setValue(this.edit_news_data.backgroundContentId);
            this.formControls.backgroundColor.setValue(this.edit_news_data.backgroundColor);
            this.formControls.fontColor.setValue(this.edit_news_data.fontColor);
            this.formControls.fontSize.setValue(this.edit_news_data.fontSize);
            this.formControls.loopCycle.setValue(this.edit_news_data.loopCycle);
            this.formControls.marginLeft.setValue(this.edit_news_data.marginLeft);
            this.formControls.marginTop.setValue(this.edit_news_data.marginTop);
            this.formControls.results.setValue(this.edit_news_data.results);
            this.formControls.rssFeedUrl.setValue(this.edit_news_data.rssFeedUrl);
            this.formControls.time.setValue(this.edit_news_data.time);
            this.rss_url_checking = true;
            this.rss_url_valid = undefined;
        }

        /** No Debounce for UI Alert Display */
        this.formControls.rssFeedUrl.valueChanges

            .pipe(debounceTime(1000), takeUntil(this._unsubscribe))
            .subscribe(async (response) => {
                this.feedUrlHasValue = response ? true : false;

                this.isDirectTechUrl = response.includes('directech');

                this.is_validating_url = true;
                const url = response as string;
                this.isInvalidUrl = !(await this._feed.check_url(url));
                this.is_validating_url = false;
                this.disabled_submit = false;
            });
    }

    /** Validate rss_url if is within API jurisdiction
     * @param {string} rss_url Entered rss_url
     */
    private async validateRssUrl(rss_url: string) {
        // this.rss_url_valid = await this._feed.check_url(rss_url, true);
        this.rss_url_valid = true;
        this.rss_url_checking = false;
    }

    protected get _createFormFields() {
        return [
            {
                label: 'Background Image',
                form_control_name: 'backgroundContentId',
                type: 'text',
                width: 'col-lg-6',
                viewType: 'upload',
                imageUri: '',
                fileName: '',
                required: false,
                api_key_ref: 'backgroundContents',
                options: null,
            },
            {
                label: 'Background Color',
                form_control_name: 'backgroundColor',
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
                form_control_name: 'fontColor',
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
                form_control_name: 'fontSize',
                errorMsg: '',
                type: 'number',
                width: 'col-lg-3',
                required: false,
                value: 44,
                options: null,
            },
            {
                label: 'Offset Left',
                form_control_name: 'marginLeft',
                errorMsg: '',
                type: 'number',
                width: 'col-lg-3',
                required: false,
                value: 10,
                options: null,
            },
            {
                label: 'Offset Top',
                form_control_name: 'marginTop',
                errorMsg: '',
                type: 'value',
                width: 'col-lg-3',
                required: false,
                value: 23,
                options: null,
            },
            {
                label: 'RSS Feed URL',
                form_control_name: 'rssFeedUrl',
                errorMsg: '',
                type: 'text',
                width: 'col-lg-4',
                required: false,
                options: null,
            },
            {
                label: 'Results',
                form_control_name: 'results',
                errorMsg: '',
                type: 'number',
                width: 'col-lg',
                required: false,
                value: 3,
                options: null,
            },
            {
                label: 'Transition Time',
                form_control_name: 'time',
                errorMsg: '',
                type: 'number',
                width: 'col-lg',
                required: false,
                value: 8,
                options: null,
            },
            {
                label: 'Loop Cycle',
                form_control_name: 'loopCycle',
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
