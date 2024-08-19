import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { NewZoneModalComponent } from 'src/app/global/components_shared/zone_components/new-zone-modal/new-zone-modal.component';
import { ConfirmTemplateModalComponent } from 'src/app/global/components_shared/template_components/confirm-template-modal/confirm-template-modal.component';
import { API_ZONE } from 'src/app/global/models';

@Component({
    selector: 'app-create-template',
    templateUrl: './create-template.component.html',
    styleUrls: ['./create-template.component.scss'],
})
export class CreateTemplateComponent implements OnInit {
    title: string = 'Create Template';
    color: string;
    created_template: any;
    disable_submit: boolean = true;
    new_template_form: FormGroup;
    screen_width: number = 1920;
    screen_height: number = 1080;
    template_name: string;
    zone_array: Array<any> = [];
    zone_background: string;
    zone_count: number = 0;
    zone_data: API_ZONE;
    zone_form = new FormArray([]);
    zone_property_form: FormGroup;
    hasMainZoneSet = false;

    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _router: Router,
    ) {}

    ngOnInit() {
        this.new_template_form = this._form.group({ template_name: ['', [Validators.required]] });
        this.zone_property_form = this._form.group({ zones: this._form.array([]) });
        this.subscribeToFormChanges();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private addZoneProperty(zone: string): void {
        const zones = this.zone_property_form.get('zones') as FormArray;
        zones.push(this.zoneProperty(zone, this.zone_count++));
    }

    public colorPicker(): void {
        this.zone_background = this.color;
    }

    public confirmTemplateCreation(): void {
        this.created_template = {
            template: { name: this.new_template_form.get('template_name').value },
            templatezones: this.zone_property_form.get('zones').value,
        };

        const dialog = this._dialog.open(ConfirmTemplateModalComponent, {
            disableClose: true,
            width: '600px',
            data: { zones: this.created_template },
        });

        dialog
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((response: any) => {
                if (response === 'cancel') return;
                this._router.navigate(['/administrator/templates']);
            });
    }

    public openNewZoneModal(): void {
        const dialog = this._dialog.open(NewZoneModalComponent, {
            width: '600px',
            disableClose: true,
        });

        dialog
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((data: string) => this.addZoneProperty(data));
    }

    private zoneProperty(data: string, index: number): FormGroup {
        this.zone_data = JSON.parse(data) as API_ZONE;
        this.zone_background = this.zone_data.background;

        return new FormGroup({
            name: new FormControl(this.zone_data.name, [Validators.required]),
            description: new FormControl(this.zone_data.name, [Validators.required]),
            background: new FormControl(this.zone_background, [Validators.required]),
            width: new FormControl(this.zone_data.width, [Validators.required]),
            height: new FormControl(this.zone_data.height, [Validators.required]),
            xpos: new FormControl(this.zone_data.xPos, [Validators.required]),
            ypos: new FormControl(this.zone_data.yPos, [Validators.required]),
            order: new FormControl(index, [Validators.required]),
            isMainZone: new FormControl(false, Validators.required),
        });
    }

    public toggleMainZone(toggledIndex: number): void {
        const formArray = this.zone_property_form.get('zones') as FormArray;
        const zonesToSetFalse = formArray.controls.filter((c, index) => index !== toggledIndex);

        if (!zonesToSetFalse.length) return;

        zonesToSetFalse.forEach((z) => {
            z.get('isMainZone').patchValue(false);
        });
    }

    private checkIfMainZoneToggled(): boolean {
        const zones = this.zone_property_form.get('zones') as FormArray;

        if (!zones.length) return false;

        return zones.controls.some((c) => c.get('isMainZone').value);
    }

    private subscribeToFormChanges(): void {
        this.new_template_form.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
            if (
                this.new_template_form.valid &&
                this.zone_property_form.get('zones').value != '' &&
                this.zone_property_form.get('zones').valid
            ) {
                this.disable_submit = false;
                return;
            }

            this.disable_submit = true;
        });

        this.zone_property_form
            .get('zones')
            .valueChanges.pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => {
                this.hasMainZoneSet = this.checkIfMainZoneToggled();

                if (this.new_template_form.valid && this.zone_property_form.get('zones').valid) {
                    this.disable_submit = false;
                    return;
                }

                this.disable_submit = true;
            });
    }
}
