import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NewZoneModalComponent } from '../../../../global/components_shared/zone_components/new-zone-modal/new-zone-modal.component';
import { API_ZONE } from '../../../../global/models/api_zone.model';
import { ConfirmTemplateModalComponent } from '../../../../global/components_shared/template_components/confirm-template-modal/confirm-template-modal.component';

@Component({
    selector: 'app-create-template',
    templateUrl: './create-template.component.html',
    styleUrls: ['./create-template.component.scss'],
})
export class CreateTemplateComponent implements OnInit {
    title: string = 'Create Template';
    subscription: Subscription = new Subscription();

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

    constructor(
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _router: Router,
    ) {}

    ngOnInit() {
        this.new_template_form = this._form.group({ template_name: ['', [Validators.required]] });

        this.zone_property_form = this._form.group({ zones: this._form.array([]) });

        this.subscription.add(
            this.new_template_form.valueChanges.subscribe((data) => {
                if (
                    this.new_template_form.valid &&
                    this.zone_property_form.get('zones').value != '' &&
                    this.zone_property_form.get('zones').valid
                ) {
                    this.disable_submit = false;
                } else {
                    this.disable_submit = true;
                }
            }),
        );

        this.subscription.add(
            this.zone_property_form.get('zones').valueChanges.subscribe((data) => {
                if (this.new_template_form.valid && this.zone_property_form.get('zones').valid) {
                    this.disable_submit = false;
                } else {
                    this.disable_submit = true;
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    addZoneProperty(zone) {
        const zones = this.zone_property_form.get('zones') as FormArray;
        zones.push(this.zoneProperty(zone, this.zone_count++));
    }

    colorPicker(e, i) {
        this.zone_background = this.color;
    }

    confirmTemplateCreation() {
        this.created_template = {
            template: { name: this.new_template_form.get('template_name').value },
            templatezones: this.zone_property_form.get('zones').value,
        };

        const dialog = this._dialog.open(ConfirmTemplateModalComponent, {
            disableClose: true,
            width: '600px',
            data: { zones: this.created_template },
        });

        this.subscription.add(
            dialog.afterClosed().subscribe((response: any) => {
                if (response === 'cancel') return;
                this._router.navigate(['/administrator/templates']);
            }),
        );
    }

    openNewZoneModal(): void {
        const dialog = this._dialog.open(NewZoneModalComponent, {
            width: '600px',
            disableClose: true,
        });

        this.subscription.add(
            dialog.afterClosed().subscribe((data: API_ZONE) => this.addZoneProperty(data)),
        );
    }

    zoneProperty(data: any, index: number) {
        this.zone_data = JSON.parse(data);
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
        });
    }
}
