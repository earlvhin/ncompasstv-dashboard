import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSlideToggleChange } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as uuid from 'uuid';

import {
	API_CONTENT,
	API_DEALER,
	API_PARENT_CATEGORY,
	API_UPDATE_HOST,
	UI_ROLE_DEFINITION,
	UI_OPERATION_DAYS,
	API_HOST,
	API_TIMEZONE,
	PAGING
} from 'src/app/global/models';

import { AuthService, CategoryService, ConfirmationDialogService, DealerService, HostService } from 'src/app/global/services';
import { BulkEditBusinessHoursComponent } from '../../components_shared/page_components/bulk-edit-business-hours/bulk-edit-business-hours.component';

@Component({
	selector: 'app-edit-single-host',
	templateUrl: './edit-single-host.component.html',
	styleUrls: ['./edit-single-host.component.scss'],
	providers: [TitleCasePipe]
})
export class EditSingleHostComponent implements OnInit, OnDestroy {
	business_hours: UI_OPERATION_DAYS[] = JSON.parse(this.page_data.host.storeHours);
	categories_loaded = false;
	categories_data: API_PARENT_CATEGORY[];
	category_selected: string;
	closed_without_edit = false;
	dealer = this.page_data.dealer;
	dealers_data: API_DEALER[] = [];
	dealers_loaded = false;
	disable_business_name = true;
	edit_host_form: FormGroup;
	edit_host_form_controls = this._editHostFormControls;
	host = this.page_data.host;
	host_timezone = this.page_data.host.timeZoneData;
	is_active_host = this.host.status === 'A';
	is_current_user_admin = this._auth.current_role === 'administrator';
	is_current_user_dealer = this._auth.current_role === 'dealer';
	is_host_data_ready = false;
	paging: PAGING;
	timezones: API_TIMEZONE[];
	timezones_loaded = false;

	private dealer_id = this.host.dealerId;
	private form_invalid = false;
	private has_content = false;
	private initial_business_hours: UI_OPERATION_DAYS[] = JSON.parse(this.page_data.host.storeHours);
	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { host: API_HOST; dealer: API_DEALER },
		private _auth: AuthService,
		private _categories: CategoryService,
		private _confirmationDialog: ConfirmationDialogService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _dialogRef: MatDialogRef<EditSingleHostComponent>,
		private _form: FormBuilder,
		private _host: HostService,
		private _router: Router,
		private _titlecase: TitleCasePipe
	) {}

	ngOnInit() {
		this.setDialogData();
		this.fillForm();
		this.getDealers();
		this.getHostContents();
		this.getCategories();
		this.getTimezones();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	addHours(data: { periods: any[]; id: string }): void {
		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: ''
		};

		data.periods.push(hours);
	}

	getDealers(event?: { page: number; is_search: boolean; no_keyword: boolean }): void {
		const page = event ? event.page : 1;

		this._dealer
			.get_dealers_with_page(page, '')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				if (page > 1) this.dealers_data.concat(response.dealers);
				else this.dealers_data = response.dealers;
				this.paging = response.paging;
			})
			.add(() => (this.dealers_loaded = true));
	}

	onBulkEditHours(): void {
		const dialog = this._dialog.open(BulkEditBusinessHoursComponent, {
			width: '550px',
			height: '450px',
			panelClass: 'position-relative',
			data: {},
			autoFocus: false
		});

		dialog.afterClosed().subscribe(
			(response) => {
				if (response) this.business_hours = response;
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	onDeleteHost(): void {
		let isForceDelete = false;
		const route = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		const hostId = this.host.hostId;
		let data: any = { message: 'Delete Host', data: 'Are you sure about this?' };

		if (this.has_content) {
			data = {
				message: 'Delete Host & Contents?',
				data: 'Choosing either will proceed with deletion. To cancel press the x above.',
				is_selection: true
			};
		}

		this._confirmationDialog.warning(data).subscribe(
			(response: boolean | string) => {
				if (typeof response === 'undefined' || !response) return;
				if (this.has_content && response !== 'no') isForceDelete = true;

				this._host
					.delete_host([hostId], isForceDelete)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(
						() => {
							this._dialogRef.close('delete-host');
							if (!this.is_current_user_admin) this._router.navigate([`/${this.roleRoute}/dealers/${this.dealer_id}`]);
							else this._router.navigate([`/${this.roleRoute}/hosts`]);
						},
						(error) => {
							throw new Error(error);
						}
					);
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	onEditBusinessName(isEdit: boolean): void {
		this.closed_without_edit = isEdit;
		if (isEdit) this.addCurrentDealerToList();
		this.disable_business_name = isEdit;
	}

	onSelectDealer(id: string) {
		this.edit_host_form.get('dealerId').setValue(id);
	}

	onToggleStatus(event: MatSlideToggleChange) {
		this.is_active_host = event.checked;
	}

	parseBusinessHours(data: { periods: any[]; status: boolean; id: string }): void {
		data.periods.length = 0;

		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: ''
		};

		data.status = !data.status;
		data.periods.push(hours);
	}

	removeHours(data: { periods: any[] }, index: number): void {
		data.periods.splice(index, 1);
	}

	async saveHostData() {
		this.checkBusinessHoursFields();

		if (this.form_invalid) {
			await this._confirmationDialog.error('Invalid Form!', 'Please make sure that all fields are correct').toPromise();
			return;
		}

		let message = 'Are you sure you want to proceed?';
		const status = this.is_active_host ? 'A' : 'I';
		const title = 'Update Host Details';

		const newHostPlace = new API_UPDATE_HOST(
			this.host.hostId,
			this._formControls.dealerId.value,
			this._formControls.businessName.value,
			this._formControls.lat.value,
			this._formControls.long.value,
			this._formControls.city.value,
			this._formControls.state.value,
			this._formControls.zip.value,
			this._formControls.region.value,
			this._formControls.address.value,
			this._formControls.category.value,
			JSON.stringify(this.business_hours),
			this._formControls.timezone.value,
			this._formControls.vistar_venue_id.value,
			status
		);

		const { notes, others } = this._formControls;

		if (notes.value && notes.value.trim().length > 0) newHostPlace.notes = notes.value;

		if (others.value && others.value.trim().length > 0) newHostPlace.others = others.value;

		if (this.hasUpdatedBusinessHours) this._host.onUpdateBusinessHours.next(true);

		if (this.host.status !== status) message += ` This will ${status === 'A' ? 'activate' : 'deactivate'} the host.`;

		const confirmUpdate = await this._confirmationDialog.warning({ message: title, data: message }).toPromise();

		if (!confirmUpdate) return;

		this._host
			.update_single_host(newHostPlace)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				async () => {
					const dialogData = {
						message: 'Host Details Updated!',
						data: 'Your changes have been saved'
					};

					await this._confirmationDialog.success(dialogData).toPromise();
					this._dialogRef.close(true);
				},
				(error) => {
					this._confirmationDialog.error();
				}
			);
	}

	searchDealer(keyword: string): void {
		this._dealer
			.get_search_dealer(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				let searchResults = [];

				if (response.paging.entities.length > 0) {
					searchResults = response.paging.entities;
					this.paging = response.paging;
				}

				this.dealers_data = [...searchResults];
			});
	}

	setTimezone(data: string): void {
		this._formControls.timezone.setValue(data);
	}

	setCategory(event: string): void {
		if (!event || event.length <= 0) return;
		event = event.replace(/_/g, ' ');
		this.category_selected = this._titlecase.transform(event);
		this._formControls.category.setValue(event);
	}

	private get hasUpdatedBusinessHours(): boolean {
		return JSON.stringify(this.business_hours) !== JSON.stringify(this.initial_business_hours);
	}

	private addCurrentDealerToList(): void {
		const filtered = this.dealers_data.filter((dealer) => dealer.dealerId === this.dealer.dealerId);

		if (filtered.length > 0) return;

		this._dealer
			.get_dealer_by_id(this.dealer.dealerId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.dealers_data.push(response);
			});
	}

	private checkBusinessHoursFields(): void {
		this.business_hours.map((data) => {
			if (data.status && data.periods.length > 0) {
				data.periods.map((period) => {
					if (period.open != '' && period.close == '') {
						this.form_invalid = true;
					} else if (period.close != '' && period.open == '') {
						this.form_invalid = true;
					} else {
						this.form_invalid = false;
					}
				});
			}
		});
	}

	private fillForm(): void {
		const host = this.host;
		this._formControls.businessName.setValue(host.name);
		this._formControls.lat.setValue(host.latitude);
		this._formControls.long.setValue(host.longitude);
		this._formControls.address.setValue(host.address);
		this._formControls.city.setValue(host.city);
		this._formControls.state.setValue(host.state);
		this._formControls.zip.setValue(host.postalCode);
		this._formControls.region.setValue(host.region);
		this._formControls.timezone.setValue(this.host_timezone.id);
		this._formControls.notes.setValue(host.notes);
		this._formControls.others.setValue(host.others);
		this._formControls.vistar_venue_id.setValue(host.vistarVenueId);
	}

	private getCategories(): void {
		this._categories
			.get_parent_categories()
			.pipe(
				takeUntil(this._unsubscribe),
				map((response) =>
					response.map((data) => {
						data.categoryName = this._titlecase.transform(data.categoryName);
						return data;
					})
				)
			)
			.subscribe((response) => {
				this.categories_data = response;
			})
			.add(() => (this.categories_loaded = true));
	}

	private getHostContents(): void {
		this._host
			.get_content_by_host_id(this.host.hostId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { contents: API_CONTENT[] }) => {
					if (response && response.contents && response.contents.length > 0) return (this.has_content = true);
					this.has_content = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getTimezones(): void {
		this._host
			.get_time_zones()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.timezones = response;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => (this.timezones_loaded = true));
	}

	private initializeForm(): void {
		this.edit_host_form = this._form.group({
			dealerId: ['', Validators.required],
			businessName: ['', Validators.required],
			address: ['', Validators.required],
			city: ['', Validators.required],
			state: ['', Validators.required],
			zip: ['', Validators.required],
			region: ['', Validators.required],
			category: ['', Validators.required],
			long: ['', Validators.required],
			lat: ['', Validators.required],
			timezone: ['', Validators.required],
			vistar_venue_id: ['', Validators.required],
			notes: [''],
			others: ['']
		});
	}

	private setDialogData(): void {
		this.initializeForm();
		this.setCategory(this.host.category);
	}

	protected get _businessHours(): UI_OPERATION_DAYS[] {
		return [
			{
				id: 1,
				label: 'M',
				day: 'Monday',
				periods: [],
				status: false
			},
			{
				id: 2,
				label: 'T',
				day: 'Tuesday',
				periods: [],
				status: false
			},
			{
				id: 3,
				label: 'W',
				day: 'Wednesday',
				periods: [],
				status: false
			},
			{
				id: 4,
				label: 'Th',
				day: 'Thursday',
				periods: [],
				status: false
			},
			{
				id: 5,
				label: 'F',
				day: 'Friday',
				periods: [],
				status: false
			},
			{
				id: 6,
				label: 'St',
				day: 'Saturday',
				periods: [],
				status: false
			},
			{
				id: 0,
				label: 'Sn',
				day: 'Sunday',
				periods: [],
				status: false
			}
		];
	}

	protected get _editHostFormControls() {
		return [
			{
				label: 'Host Business Name',
				control: 'businessName',
				placeholder: 'Ex. SM Center Pasig',
				col: 'col-lg-6'
			},
			{
				label: 'Category',
				control: 'category',
				placeholder: 'Ex. School',
				col: 'col-lg-6',
				autocomplete: true
			},
			{
				label: 'Latitude',
				control: 'lat',
				placeholder: 'Ex. 58.933',
				col: 'col-lg-6'
			},
			{
				label: 'Longitude',
				control: 'long',
				placeholder: 'Ex. 58.933',
				col: 'col-lg-6'
			},
			{
				label: 'Address',
				control: 'address',
				placeholder: 'Ex. 21st Drive Fifth Avenue Place',
				col: 'col-lg-6'
			},
			{
				label: 'City',
				control: 'city',
				placeholder: 'Ex. Chicago',
				col: 'col-lg-3'
			},
			{
				label: 'State',
				control: 'state',
				placeholder: 'Ex. IL',
				col: 'col-lg-3'
			},
			{
				label: 'Region',
				control: 'region',
				placeholder: 'Ex. SW',
				col: 'col-lg-4'
			},
			{
				label: 'Zip Code',
				control: 'zip',
				placeholder: 'Ex. 54001',
				col: 'col-lg-4'
			},
			{
				label: 'Timezone',
				control: 'timezone',
				placeholder: 'Ex. US/Central',
				col: 'col-lg-4',
				autocomplete: true
			},
			{
				label: 'Vistar Venue ID',
				control: 'vistar_venue_id',
				placeholder: 'Ex. Venue ID for Vistar',
				col: 'col-lg-12'
			},
			{
				label: 'Notes',
				control: 'notes',
				placeholder: 'Enter your notes here...',
				type: 'textarea',
				col: 'col-lg-6'
			},
			{
				label: 'Others',
				control: 'others',
				placeholder: 'Enter your others here...',
				type: 'textarea',
				col: 'col-lg-6'
			}
		];
	}

	protected get _formControls() {
		return this.edit_host_form.controls;
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get isCurrentUserDealer() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.dealer;
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
