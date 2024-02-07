import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_CONTENT, WEATHER_FEED_STYLE_DATA } from 'src/app/global/models';
import { FeedMediaComponent } from '../feed-media/feed-media.component';
import { FeedService } from 'src/app/global/services';

@Component({
    selector: 'app-weather-form',
    templateUrl: './weather-form.component.html',
    styleUrls: ['./weather-form.component.scss'],
})
export class WeatherFormComponent implements OnInit, OnDestroy {
    @Input() selected_dealer: string;
    @Input() edit_weather_data: WEATHER_FEED_STYLE_DATA;
    @Output() open_media_library: EventEmitter<any> = new EventEmitter();
    @Output() weather_feed_data: EventEmitter<any> = new EventEmitter();

    selected_background_image: string;
    selected_banner_image: string;
    zipcode_valid: boolean;
    zipcode_checking: boolean = false;

    font_family = [
        { label: 'Helvetica' },
        { label: 'Poppins' },
        { label: 'Roboto' },
        { label: 'Montserrat' },
    ];

    orientation = [{ label: 'Vertical' }, { label: 'Horizontal' }];

    weather_form: FormGroup;
    weather_form_fields = this._weatherFormFields;
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

    /** On Color Picker Field Changed */
    colorPicker(color: string, controlName: string) {
        this.weather_form.get(controlName).setValue(color);
    }

    /** Open Media Library where contents are assigned to selected dealer */
    openMediaLibraryModal(form_control_name: string): void {
        /** Open Feed Media Modal */
        const dialog = this._dialog.open(FeedMediaComponent, {
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
                this.weather_form.controls[form_control_name].setValue(data[0].contentId);

                /** Set UI Image Display */
                this.weather_form_fields.map((i) => {
                    if (i.form_control_name === form_control_name) {
                        i.imageUri = data[0].thumbnail;
                        i.fileName = data[0].title;
                    }
                });
            }
        });
    }

    /** Remove Selected Media File
     * @param {string} control Clicked Upload Control Name
     */
    removeSelectedMedia(control: string) {
        this.weather_form.controls[control].reset();

        this.weather_form_fields.map((i) => {
            if (i.form_control_name === control) {
                i.fileName = null;
                i.imageUri = null;
            }
        });
    }

    /** Pass weather feed data to parent component */
    generateWeatherFeed() {
        this.weather_feed_data.emit(this.weather_form.value);
    }

    /** Weather Form Control Getter */
    get formControls() {
        return this.weather_form.controls;
    }

    /** Prepare Forms */
    private prepareForms(): void {
        let formConfig = {};

        /** Loop through form fields object and prepare for group */
        this.weather_form_fields.map((field) => {
            const validators: any[] = [];

            if (field.required) validators.push(Validators.required);
            if (field.viewType === 'colorpicker')
                validators.push(this._feed.validateColorFieldValues.bind(this));

            Object.assign(formConfig, {
                [field.form_control_name]: [field.value ? field.value : null, validators],
            });
        });

        this.weather_form = this._form.group(formConfig);
        this.formControls.numberDays.setValidators([Validators.min(1), Validators.max(5)]);
        this.formControls.zipCode.setValidators([Validators.minLength(5), Validators.maxLength(5)]);
        this.formControls.headerImageSize.setValue(500);
        this.formControls.footerImageSize.setValue(500);

        if (this.edit_weather_data) {
            this.weather_form_fields.map((i) => {
                if (i.viewType == 'upload' && this.edit_weather_data[i.api_key_ref]) {
                    i.imageUri = `${this.edit_weather_data[i.api_key_ref].url}${this.edit_weather_data[i.api_key_ref].fileName}`;
                    i.fileName = this.edit_weather_data[i.api_key_ref].title;
                }

                if (i.viewType == 'colorpicker') {
                    i.colorValue = this.edit_weather_data[i.form_control_name];
                }
            });

            this.formControls.backgroundContentId.setValue(
                this.edit_weather_data.backgroundContentId,
            );
            this.formControls.bannerContentId.setValue(this.edit_weather_data.bannerContentId);
            this.formControls.footerContentId.setValue(this.edit_weather_data.footerContentId);
            this.formControls.boxBackgroundColor.setValue(
                this.edit_weather_data.boxBackgroundColor,
            );
            this.formControls.headerImageSize.setValue(
                this.edit_weather_data.headerImageSize || 500,
            );
            this.formControls.footerImageSize.setValue(
                this.edit_weather_data.footerImageSize || 500,
            );
            this.formControls.daysFontColor.setValue(this.edit_weather_data.daysFontColor);
            this.formControls.numberDays.setValue(this.edit_weather_data.numberDays);
            this.formControls.fontFamily.setValue(this.edit_weather_data.fontFamily);
            this.formControls.zipCode.setValue(this.edit_weather_data.zipCode);

            this.validateZipCode(this.formControls.zipCode.value);
        }

        /** No Debounce for UI Alert Display */
        this.formControls.zipCode.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            this.zipcode_checking = true;
            this.zipcode_valid = undefined;
        });

        /** Debounce for Field Validity and API Call */
        this.formControls.zipCode.valueChanges
            .pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this._unsubscribe))
            .subscribe(() => {
                if (this.formControls.zipCode.valid) {
                    this.validateZipCode(this.formControls.zipCode.value);
                }
            });
    }

    /** Validate Zipcode if is within API jurisdiction
     * @param {string} zipCode Entered Zipcode
     */
    private validateZipCode(zipCode: string) {
        this._feed
            .validate_weather_zip(zipCode)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: { success: boolean }) => (this.zipcode_valid = data.success),
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.zipcode_checking = false));
    }

    protected get _weatherFormFields() {
        return [
            {
                label: 'Background Image',
                form_control_name: 'backgroundContentId',
                type: 'text',
                width: 'col-lg-4',
                viewType: 'upload',
                imageUri: '',
                fileName: '',
                required: false,
                value: null,
                api_key_ref: 'backgroundContents',
            },
            {
                label: 'Header Image',
                form_control_name: 'bannerContentId',
                type: 'text',
                width: 'col-lg-4',
                viewType: 'upload',
                imageUri: '',
                fileName: '',
                required: false,
                value: null,
                api_key_ref: 'bannerContents',
            },
            {
                label: 'Footer Image',
                form_control_name: 'footerContentId',
                type: 'text',
                width: 'col-lg-4',
                viewType: 'upload',
                imageUri: '',
                fileName: '',
                required: false,
                value: null,
                api_key_ref: 'footerContents',
            },
            {
                label: 'Box Background Color',
                form_control_name: 'boxBackgroundColor',
                type: 'text',
                viewType: 'colorpicker',
                colorValue: '#FFFFFF',
                value: '#FFFFFF',
                width: 'col-lg-4',
                required: true,
            },
            {
                label: 'Days Font Color',
                form_control_name: 'daysFontColor',
                type: 'text',
                width: 'col-lg-4',
                viewType: 'colorpicker',
                colorValue: '#000000',
                value: '#000000',
                required: true,
            },
            {
                label: 'Font Family',
                form_control_name: 'fontFamily',
                type: 'text',
                width: 'col-lg-4',
                viewType: 'select',
                options: this.font_family,
                value: null,
                required: false,
            },
            {
                label: 'Header Image Size in Pixels',
                form_control_name: 'headerImageSize',
                type: 'number',
                width: 'col-lg-3',
                value: null,
                required: false,
            },
            {
                label: 'Footer Image Size in Pixels',
                form_control_name: 'footerImageSize',
                type: 'number',
                width: 'col-lg-3',
                value: null,
                required: false,
            },
            {
                label: 'Number of days to display, Maximum 5',
                form_control_name: 'numberDays',
                type: 'number',
                width: 'col-lg-3',
                value: null,
                required: false,
            },
            {
                label: 'US Zip Code',
                form_control_name: 'zipCode',
                errorMsg: '',
                type: 'text',
                width: 'col-lg-3',
                value: null,
                required: true,
            },
        ];
    }
}
