import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { API_ZONE } from '../../../models/api_zone.model';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-new-zone-modal',
	templateUrl: './new-zone-modal.component.html',
	styleUrls: ['./new-zone-modal.component.scss']
})

export class NewZoneModalComponent implements OnInit {

	title: string = "Set Zone Properties"
	subscription: Subscription = new Subscription;
	
	color: string;
	disable_btn: boolean = true;
	new_zone_properties: FormGroup;
	zone_data: API_ZONE;
	
	constructor(
		private _form: FormBuilder
	) { }

	ngOnInit() {
		this.new_zone_properties = this._form.group(
			{
				zone_name: ['', Validators.required],
				zone_height: ['', Validators.required],
				zone_width: ['', Validators.required],
				zone_x: ['', Validators.required],
				zone_y: ['', Validators.required],
				zone_background: ['', Validators.required]
			}
		)

		this.subscription.add(
			this.new_zone_properties.valueChanges.subscribe(
				(data: any) => {
					if (this.new_zone_properties.valid) {
						this.disable_btn = false;
					} else {
						this.disable_btn = true;
					}
				}
			)
		)
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	get f() { 
		return this.new_zone_properties.controls; 
	}

	colorPicker(e) {
		this.new_zone_properties.get('zone_background').setValue(e);
	}

	zoneData(): API_ZONE {
		return new API_ZONE(
			this.f.zone_name.value,
			this.f.zone_x.value,
			this.f.zone_y.value,
			this.f.zone_height.value,
			this.f.zone_width.value,
			this.f.zone_background.value,
			0
		)
	}
}
