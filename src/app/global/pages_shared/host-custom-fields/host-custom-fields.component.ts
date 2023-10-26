import { Component, OnInit } from '@angular/core';
import { CustomFieldGroup, CustomFields, FieldGroup, Fields, FieldsAPI } from '../../models/host-custom-field-group';
import { HostService } from '../../services/host-service/host.service';

@Component({
	selector: 'app-host-custom-fields',
	templateUrl: './host-custom-fields.component.html',
	styleUrls: ['./host-custom-fields.component.scss']
})
export class HostCustomFieldsComponent implements OnInit {
	title: string = 'Host Custom Fields';
	custom_fields: CustomFields[] = [];
	custom_host_fields: Fields[] = [];
	edit_mode: boolean = false;
	field_group_name: string;

	constructor(private _host: HostService) {}

	ngOnInit() {
		this.getFields();
	}

	addField() {
		this.custom_host_fields.push(new Fields(`Field ${this.custom_host_fields.length + 1}`, 'text', 128));
	}

	createCustomField() {
		const fieldgroup = new CustomFieldGroup(new FieldGroup(this.field_group_name), this.custom_host_fields);

		this._host.create_field_group(fieldgroup).subscribe(
			(data) => {},
			(error) => {
				console.error(error);
			}
		);
	}

	editFieldGroup(index: number, id: string) {
		// Reset Form Fields
		this.field_group_name = null;
		this.custom_host_fields = [];

		// Set Form Fields
		this._host.get_field_by_id(id).subscribe(
			(data: FieldsAPI) => {
				this.edit_mode = true;

				this.field_group_name = this.custom_fields[index].fieldGroupName;

				data.fields.map((i) => {
					this.custom_host_fields.push(new Fields(i.fieldName, i.fieldType, i.fieldLength));
				});
			},
			(error) => {
				console.error(error);
			}
		);
	}

	getFields() {
		this._host.get_fields().subscribe(
			(data) => {
				this.custom_fields = data.paging.entities;
			},
			(error) => {
				console.error(error);
			}
		);
	}

	setFieldName(i) {}

	saveCustomFieldChanges() {}
}
