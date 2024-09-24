import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/internal/operators';
import { API_CONTENT_V2 } from 'src/app/global/models';
import { IsvideoPipe } from 'src/app/global/pipes';

@Component({
    selector: 'app-basic-settings',
    templateUrl: './basic-settings.component.html',
    styleUrls: ['./basic-settings.component.scss'],
    providers: [IsvideoPipe],
})
export class BasicSettingsComponent implements OnInit, OnDestroy {
    @Input() bulk_setting = false;
    @Input() can_set_frequency = true;
    @Input() sequence_setting = true;
    @Input() has_image_and_feed = false;
    @Input() playlist_content: API_CONTENT_V2[] = [];
    @Input() playlist_content_length = 0;
    @Output() changed = new EventEmitter();

    basicSettings: FormGroup = new FormGroup({});
    formReady: boolean = false;
    frequencyMinCount = 6;
    isParentFrequency = false;
    isChildFrequency = false;
    isContentAFiller = false;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _formBuilder: FormBuilder,
        private _video: IsvideoPipe,
    ) {}

    ngOnInit() {
        this.initializeForm();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    private initializeForm() {
        const content = this.playlist_content[0];
        this.isParentFrequency = (content && content.frequency === 33) || (content && content.frequency === 22);
        this.isChildFrequency = !this.isParentFrequency && content && content.frequency !== 0;
        const parseFormValue = (value: any) => !this.bulk_setting && value;

        // if the frequency value is 22 or 33 then parse it to 2 or 3 to comply with the form values
        const parsedFrequency = content && this.parseFrequencyValueToString(content.frequency);
        this.isContentAFiller = this.isFillerContent(content);

        this.basicSettings = this._formBuilder.group({
            duration: [
                {
                    value: content ? parseFormValue(content.duration) : 20,
                    disabled:
                        (!this.bulk_setting && this._video.transform(content.fileType)) ||
                        this.isChildFrequency ||
                        this.isContentAFiller,
                },
            ],
            isFullScreen: [
                {
                    value: content ? parseFormValue(content.isFullScreen) : 0,
                    disabled: this.isChildFrequency || this.isContentAFiller,
                },
            ],
        });

        if (!this.bulk_setting) {
            const frequencyCtrl = new FormControl(parseFormValue(parsedFrequency) || 0);
            this.basicSettings.addControl('frequency', frequencyCtrl);
            if (this.isChildFrequency) this.basicSettings.get('frequency').disable();
        }

        this.changed.emit({
            ...this.basicSettings.getRawValue(),
            isFullScreen: this.basicSettings.controls['isFullScreen'].value ? 1 : 0,
        });
        this.subscribeToFormChanges();
        this.formReady = true;
    }

    private subscribeToFormChanges() {
        this.basicSettings.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe({
            next: (res) => {
                const durationCtrl = this.basicSettings.get('duration');
                if (res.duration <= 0) durationCtrl.patchValue(20, { emitEvent: false });
                this.changed.emit({ ...res, isFullScreen: res.isFullScreen ? 1 : 0 });
            },
        });
    }

    private parseFrequencyValueToString(data: number) {
        let result = 0;

        switch (data) {
            case 22:
                result = 2;
                break;
            case 33:
                result = 3;
                break;
            default:
                result = data;
        }

        return `${result}`;
    }

    public isFillerContent(content: API_CONTENT_V2): boolean {
        if (!content) return;
        return content.classification === 'filler-v2';
    }
}
