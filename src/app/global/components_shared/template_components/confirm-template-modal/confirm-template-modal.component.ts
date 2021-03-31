import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TemplateService } from '../../../../global/services/template-service/template.service';

@Component({
	selector: 'app-confirm-template-modal',
	templateUrl: './confirm-template-modal.component.html',
	styleUrls: ['./confirm-template-modal.component.scss']
})

export class ConfirmTemplateModalComponent implements OnInit {

	@Input() zone_data: any;
	data_saved: boolean = false;
	screen_width: number = 1920;
	screen_height: number = 1080;
	is_submitted: boolean = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public z_data: any,
		private _template: TemplateService
	) { }

	ngOnInit() {
		this.zone_data = this.z_data;
		//console.log('saveTemplate', this.zone_data);
	}

	
	saveTemplate() {
		this.is_submitted = true;
		this._template.new_template(this.zone_data.zones).subscribe(
			data  => {
				this.data_saved = true;
				this.is_submitted = false;
				//console.log(data)
			},
			error => {
				console.log(error);
			}
		)
	}
}
