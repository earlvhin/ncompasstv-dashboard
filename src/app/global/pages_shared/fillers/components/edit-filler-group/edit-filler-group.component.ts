import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subject, Subscription } from 'rxjs';
import { MatSelect, MatDialog } from '@angular/material';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import * as filestack from 'filestack-js';
import { environment } from 'src/environments/environment';

import { DealerService, DealerAdminService, FillerService } from 'src/app/global/services';
import { API_UPDATE_FILLER_GROUP } from 'src/app/global/models/api_update-filler-groups';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-edit-filler-group',
	templateUrl: './edit-filler-group.component.html',
	styleUrls: ['./edit-filler-group.component.scss']
})
export class EditFillerGroupComponent implements OnInit {
	@ViewChild('dealerMultiSelect', { static: false }) dealerMultiSelect: MatSelect;
	dealer_admins: any = [];
	dealers_list: any = [];
	form: FormGroup;
	filler_group_form_loaded = false;
	selectedDealersControl: any;
	selectedDealerAdminsControl: any;
	selected_dealers = [];
	selected_dealeradmins = [];
	selected_group_id = this.page_data.filler_group_id;
	selected_group_data: any;

	subscription: Subscription = new Subscription();
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { filler_group_id: string },
		private _dealer_admin: DealerAdminService,
		private _form_builder: FormBuilder,
		private _dealer: DealerService,
		private _filler: FillerService,
		private _dialog: MatDialog
	) {}

	ngOnInit() {
		this.getDealers();
		this.getAllDealerAdmin();
		this.initializeForm();
		this.getSelectedGroup();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			fillerGroupName: [null, Validators.required],
			inPairs: [null, Validators.required],
			dealers: [[]],
			dealerAdmins: [[]]
		});

		this.selectedDealersControl = this.form.get('dealers');
		this.selectedDealerAdminsControl = this.form.get('dealerAdmins');
	}

	getDealers() {
		this.subscription.add(this._dealer.get_dealers_with_page_minified(1, '', 0).subscribe((data) => (this.dealers_list = data.paging.entities)));
	}

	getAllDealerAdmin() {
		this._dealer_admin
			.get_search_dealer_admin_getall()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => (this.dealer_admins = response.dealerAdmin));
	}

	private getSelectedGroup() {
		this._filler
			.get_filler_group_by_id(this.selected_group_id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.selected_group_data = response.data[0];
				setTimeout(() => {
					this.fillForm();
				}, 1000);
			});
	}

	private fillForm(): void {
		const filler_group = this.selected_group_data;
		this._formControls.fillerGroupName.setValue(filler_group.name);
		this._formControls.inPairs.setValue(filler_group.paired);
		this.filler_group_form_loaded = true;

		const dealers_value = this.selected_group_data.blacklistedDealers.map((dealer) => {
			return this.dealers_list.find((dealers) => {
				return dealers.dealerId === dealer.dealerId;
			});
		});
		this.selectedDealersControl.setValue(dealers_value);

		const dealer_admins_value = this.selected_group_data.blacklistedDealerAdmins.map((dealeradmin) => {
			return this.dealer_admins.find((da) => {
				return da.userId === dealeradmin.userId;
			});
		});
		this.selectedDealerAdminsControl.setValue(dealer_admins_value);
	}

	onSubmit() {
		this.modifyData();
		const updateFillerGroup = new API_UPDATE_FILLER_GROUP(
			this.selected_group_data.fillerGroupId,
			this._formControls.fillerGroupName.value,
			this._formControls.inPairs.value,
			this.selected_dealers,
			this.selected_dealeradmins
		);

		this._filler
			.add_filler_group(updateFillerGroup)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) =>
				this.openConfirmationModal('success', 'Filler Group Updated!', 'Hurray! You successfully modified a Filler Group', true)
			);
	}

	openConfirmationModal(status: string, message: string, data: any, close?): void {
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
			.subscribe(() => {
				if (close) this._dialog.closeAll();
			});
	}

	modifyData() {
		const dealers = this._formControls.dealers.value;
		dealers.map((dealer) => this.selected_dealers.push(dealer.dealerId));
		const dealeradmins = this._formControls.dealerAdmins.value;
		dealeradmins.map((dealeradmin) => this.selected_dealeradmins.push(dealeradmin.userId));
	}

	onTogglePairs(toggle) {
		this._formControls.inPairs.setValue(toggle.checked === true ? 1 : 0);
	}

	onUploadImage() {
		this._dialog.closeAll();
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions).open();
	}

	protected get filestackOptions(): filestack.PickerOptions {
		return {
			storeTo: {
				container: this.selected_group_data.bucketName + '/',
				region: 'us-east-2'
			},
			accept: ['image/jpg', 'image/jpeg', 'image/png'],
			maxFiles: 1,
			imageMax: [720, 640],
			onUploadDone: (response) => {
				const coverphoto = {
					fillerGroupId: this.selected_group_data.fillerGroupId,
					coverPhoto: this.splitFileName(response.filesUploaded[0].key)
				};

				this._filler
					.update_filler_group_photo(coverphoto)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(() =>
						this.openConfirmationModal(
							'success',
							'Filler Group Cover Photo Updated!',
							'Hurray! You successfully updated Filler Group Cover Photo'
						)
					);
			}
		};
	}

	splitFileName(name) {
		const splitted_file_name = name.split('/').pop();
		return splitted_file_name;
	}

	protected get _formControls() {
		return this.form.controls;
	}
}
