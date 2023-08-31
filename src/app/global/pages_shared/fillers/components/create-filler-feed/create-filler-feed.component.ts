import { Component, OnInit, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FillerService, AuthService } from 'src/app/global/services';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-create-filler-feed',
	templateUrl: './create-filler-feed.component.html',
	styleUrls: ['./create-filler-feed.component.scss']
})
export class CreateFillerFeedComponent implements OnInit {
	enable_add_button: boolean = false;
	existing_data: any;
	form: FormGroup;
	filler_name: string = '';
	filler_groups: any = [];
	groups_loaded: boolean = false;
	selected_group: any = this.page_data.group;
	selected_groups: any = [];
	final_data_to_upload: any;
	fillerQuantity: any = {};
	total_quantity = 0;
	remaining = 20;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { group: any; id: any; from_edit_table: any },
		private _form_builder: FormBuilder,
		private _filler: FillerService,
		private _dialog: MatDialog,
		private _route: Router,
		private _auth: AuthService
	) {}

	ngOnInit() {
		this.initializeForm();
		this.getAllFillers();
		if (this.page_data.from_edit_table) this.getFillerFeedDetail(this.page_data.id);
	}

	private getFillerFeedDetail(id) {
		this._filler
			.get_filler_group_solo(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				this.existing_data = data;
			})
			.add(() => {
				this.fillUpForm(this.existing_data);
			});
	}

	fillUpForm(data) {
		this._formControls.fillerGroupName.setValue(data.name);
		this._formControls.fillerInterval.setValue(data.interval);
		this._formControls.fillerDuration.setValue(data.duration);

		setTimeout(() => {
			data.fillerGroups.map((groups) => {
				const existing_list = this.filler_groups.filter((list) => list.fillerGroupId == groups.fillerGroupId);
				groups.count = existing_list[0].count;
			});

			data.fillerGroups.map((groups) => {
				this.removeItemsOnTheList(groups.fillerGroupId);
			});

			this.selected_groups = data.fillerGroups;
			this.countTotalQuantity();
		}, 1000);
	}

	removeItemsOnTheList(id) {
		this.filler_groups = this.filler_groups.filter((groups) => {
			return groups.fillerGroupId != id;
		});
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			fillerGroupName: [null, Validators.required],
			fillerInterval: [1, Validators.required],
			fillerDuration: [20, Validators.required],
			fillerQuantity: [null],
			fillerGroupId: [null]
		});
	}

	protected get _formControls() {
		return this.form.controls;
	}

	getAllFillers(key?) {
		this._filler
			.get_filler_groups(1, key, 0, 'Name', 'asc')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				let groups_with_count_only = data.paging.entities.filter((group) => {
					return group.count > 0;
				});
				this.filler_groups = groups_with_count_only;
				this.groups_loaded = true;
			})
			.add(() => {
				if (this.selected_group.length != 0) {
					this.filler_name = this.selected_group.name;
					this.setFillerGroup(this.selected_group.fillerGroupId);
					this.addToSelectedFillerGroup();
				}

				if (this.page_data.from_edit_table) this.getFillerFeedDetail(this.page_data.id);
			});
	}

	onSubmit(data) {
		let type_of_activity = '';
		if (this.page_data.from_edit_table) type_of_activity = ' Updated ';
		else type_of_activity = ' Created ';

		this._filler
			.add_filler_feed(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.openConfirmationModal(
						'success',
						'Filler Feed' + type_of_activity + '!',
						'Hurray! You successfully' + type_of_activity + 'a Filler Feed'
					);
				},
				(error) => {}
			);
	}

	openConfirmationModal(status: string, message: string, data: any): void {
		this._dialog
			.open(ConfirmationModalComponent, {
				width: '500px',
				height: '350px',
				data: {
					status: status,
					message: message,
					data: data
				}
			})
			.afterClosed()
			.subscribe((response) => {
				this._route.navigateByUrl(`/${this.roleRoute}/feeds?tab=1`);
				this._dialog.closeAll();
			});
	}

	setFillerGroup(id: string) {
		this._formControls.fillerGroupId.setValue(id);
		this.enable_add_button = true;
	}

	addToSelectedFillerGroup() {
		let group = this.filler_groups.filter((groups) => {
			groups.quantity = 1;
			return groups.fillerGroupId == this._formControls.fillerGroupId.value;
		});
		this.selected_groups.push(group[0]);

		//Remove from current selection
		this.filler_groups = this.filler_groups.filter((groups) => {
			return groups.fillerGroupId != this._formControls.fillerGroupId.value;
		});
		this.enable_add_button = false;
		this.countTotalQuantity();
	}

	removeSelectedFiller(group) {
		//Push to current selection
		this.filler_groups.push(group);

		//Remove from selected groups
		this.selected_groups = this.selected_groups.filter((groups) => {
			return groups.fillerGroupId != group.fillerGroupId;
		});
		this.countTotalQuantity();
	}

	arrangeData() {
		this.final_data_to_upload = {
			name: this._formControls.fillerGroupName.value,
			Interval: this._formControls.fillerInterval.value,
			Duration: this._formControls.fillerDuration.value,
			PlaylistGroups: []
		};

		if (this.page_data.from_edit_table) {
			this.final_data_to_upload.fillerPlaylistId = this.existing_data.fillerPlaylistId;
		}

		this.selected_groups.map((group) => {
			let group_selected = {
				fillerGroupId: group.fillerGroupId,
				Quantity: group.quantity
			};
			this.final_data_to_upload.PlaylistGroups.push(group_selected);
		});

		this.onSubmit(this.final_data_to_upload);
	}

	disableSelectionField() {
		if ((this.filler_groups.length == 0 && this.groups_loaded) || this.filler_name != '') return true;
		else return false;
	}

	countTotalQuantity() {
		this.total_quantity = 0;
		this.remaining = 20;
		this.selected_groups.map((group) => {
			this.total_quantity = this.total_quantity + group.quantity;
		});
		this.remaining = this.remaining - this.total_quantity;
	}

	enforceMinMax(el) {
		if (el.target.value != '') {
			if (parseInt(el.target.value) < parseInt(el.target.min)) el.target.value = el.target.min;
			if (parseInt(el.target.value) > parseInt(el.target.max)) el.target.value = el.target.max;
		}
	}

	saveQuantity(index) {
		this.selected_groups[index].quantity = this._formControls.fillerQuantity.value;
		this.countTotalQuantity();
	}

	routeToFillerGroup(id) {
		const url = this._route.serializeUrl(this._route.createUrlTree([`/${this.roleRoute}/fillers/view-fillers-group/${id}`], {}));
		window.open(url, '_blank');
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
