import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { MatSelect } from '@angular/material';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { DealerService, DealerAdminService } from 'src/app/global/services';

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
	selectedDealersControl: any;
	selectedDealerAdminsControl: any;

	subscription: Subscription = new Subscription();
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _dealer_admin: DealerAdminService, private _form_builder: FormBuilder, private _dealer: DealerService) {}

	ngOnInit() {
		this.initializeForm();
		this.getDealers();
		this.getAllDealerAdmin();
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
		this.subscription.add(
			this._dealer.get_dealers_with_page(1, '', 0).subscribe((data) => {
				this.dealers_list = data.dealers;
			})
		);
	}

	getAllDealerAdmin() {
		this._dealer_admin
			.get_search_dealer_admin_getall()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.dealer_admins = response.dealerAdmin;
			});
	}

	onSubmit() {}
}
