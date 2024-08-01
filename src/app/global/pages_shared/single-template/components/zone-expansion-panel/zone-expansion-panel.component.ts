import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_ZONE } from 'src/app/global/models';
import { FormService } from 'src/app/global/services';

@Component({
    selector: 'app-zone-expansion-panel',
    templateUrl: './zone-expansion-panel.component.html',
    styleUrls: ['./zone-expansion-panel.component.scss'],
})
export class ZoneExpansionPanelComponent implements OnInit, OnDestroy {
    @Input() data: API_ZONE;
    @Output() isFormValid: boolean;
    @Output() toggled_main_zone = new EventEmitter<{ templateZoneId: string; isMainZone: boolean }>();
    form: FormGroup;
    formControlConfigs = this._formControlConfigurations;
    mainZoneToggleControl = new FormControl(false);
    firstRowFields = this.formControlConfigs.filter((config) => config.row === 1);
    secondRowFields = this.formControlConfigs.filter((config) => config.row === 2);
    selectedZoneColor: string;
    private originalData: API_ZONE;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _form: FormService,
        private _form_builder: FormBuilder,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.subscribeToFormArrayClear();
        this.originalData = Object.freeze(this.data);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();

        // execute this to ensure that the there are no duplicate form array values
        this.removeControlFromArray();
    }

    public isMainZone(): boolean {
        return this.data.isMainZone;
    }

    public onReset(): void {
        this.initializeForm(true);
    }

    public onSelectZoneColor(value: string): void {
        this.form.get('background').setValue(value);
    }

    public toggleMainZone(e: MatSlideToggleChange): void {
        this.form.get('isMainZone').setValue(e.checked);
        this.toggled_main_zone.emit({ templateZoneId: this.data.templateZoneId, isMainZone: e.checked });
    }

    private removeControlFromArray(): void {
        const controlName = this.form.get('name');
        const index = this._form.formArray.controls.findIndex((c) => c.get('name').value === controlName);
        this._form.formArray.removeAt(index);
    }

    private initializeForm(reset = false): void {
        const formConfiguration = {};
        const zone = reset ? this.originalData : this.data;

        this.formControlConfigs.forEach((config) => {
            const data: any[] = [zone[config.name]];
            if (config.required) data.push(Validators.required);
            formConfiguration[config.name] = data;
        });

        this.form = this._form_builder.group(formConfiguration);
        this.form.get('isMainZone').setValue(this.data.isMainZone, { emitEvent: false });
        this._form.addForm(this.form);
        this.isFormValid = this.form.valid;
        this.selectedZoneColor = this.form.get('background').value;
    }

    private subscribeToFormArrayClear(): void {
        this._form.onClearFormArray.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => this._form.formArray.clear);
    }

    protected get _formControlConfigurations() {
        return [
            { name: 'templateZoneId', type: 'text', required: true },
            { name: 'name', type: 'text', label: '', placeholder: 'Name', required: true, row: 1 },
            { name: 'order', type: 'number', label: '', placeholder: 'Order', required: true, row: 1 },
            { name: 'width', type: 'number', label: '', placeholder: 'Width', required: true, row: 2 },
            {
                name: 'description',
                type: 'text',
                label: '',
                placeholder: 'Description',
                required: true,
                row: 1,
            },
            {
                name: 'background',
                type: 'color',
                label: '',
                placeholder: 'Color',
                required: true,
                row: 1,
            },
            {
                name: 'height',
                type: 'number',
                label: '',
                placeholder: 'Height',
                required: true,
                row: 2,
            },
            {
                name: 'xPos',
                type: 'number',
                label: '',
                placeholder: 'X-Position',
                required: true,
                row: 2,
            },
            {
                name: 'yPos',
                type: 'number',
                label: '',
                placeholder: 'Y-Position',
                required: true,
                row: 2,
            },
            {
                name: 'isMainZone',
                row: 0,
            },
        ];
    }
}
