import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_ZONE } from 'src/app/global/models';

@Component({
    selector: 'app-new-zone-modal',
    templateUrl: './new-zone-modal.component.html',
    styleUrls: ['./new-zone-modal.component.scss'],
})
export class NewZoneModalComponent implements OnInit {
    color: string;
    disable_btn = true;
    new_zone_properties: FormGroup;
    title = 'Set Zone Properties';

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(private _form: FormBuilder) {}

    ngOnInit() {
        this.new_zone_properties = this._form.group({
            zone_name: ['', Validators.required],
            zone_height: ['', Validators.required],
            zone_width: ['', Validators.required],
            zone_x: ['', Validators.required],
            zone_y: ['', Validators.required],
            zone_background: ['', Validators.required],
        });

        this.new_zone_properties.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            if (this.new_zone_properties.valid) {
                this.disable_btn = false;
                return;
            }

            this.disable_btn = true;
        });
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    get f() {
        return this.new_zone_properties.controls;
    }

    colorPicker(value: string) {
        this.new_zone_properties.get('zone_background').setValue(value);
    }

    zoneData(): API_ZONE {
        return new API_ZONE(
            this.f.zone_name.value,
            this.f.zone_x.value,
            this.f.zone_y.value,
            this.f.zone_height.value,
            this.f.zone_width.value,
            this.f.zone_background.value,
            0,
        );
    }
}
