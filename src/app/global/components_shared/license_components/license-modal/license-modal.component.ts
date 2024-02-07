import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LicenseService } from '../../../services/license-service/license.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-license-modal',
    templateUrl: './license-modal.component.html',
    styleUrls: ['./license-modal.component.scss'],
})
export class LicenseModalComponent implements OnInit {
    generate_license_form: FormGroup;
    dealers: Array<API_DEALER> = [];
    dealers_data: Array<any> = [];
    dealer_id: string;
    is_submitted: boolean;
    license_generated: boolean;
    invalid_form: boolean = true;
    subscription = new Subscription();
    paging: any;
    loading_data: boolean = false;
    loading_search: boolean = false;
    is_search: boolean = false;

    constructor(
        private _dealer: DealerService,
        private _form: FormBuilder,
        private _license: LicenseService,
    ) {}

    ngOnInit() {
        // So ugly Optimize
        this.generate_license_form = this._form.group({
            dealer: ['', Validators.required],
            number_of_license: ['', Validators.required],
        });

        this.subscription.add(
            this.generate_license_form.valueChanges.subscribe((data) => {
                if (
                    this.generate_license_form.valid &&
                    this.f.number_of_license.value > 0 &&
                    this.f.number_of_license.value <= 50
                ) {
                    this.invalid_form = false;
                } else {
                    this.invalid_form = true;
                }
            }),
        );

        this.getDealers(1);
    }

    // Convenience getter for easy access to form fields
    get f() {
        return this.generate_license_form.controls;
    }

    generateLicense() {
        this.is_submitted = true;
        this._license
            .generate_license(this.f.dealer.value, this.f.number_of_license.value)
            .subscribe(
                (data) => {
                    this.license_generated = true;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    searchData(e) {
        this.loading_search = true;
        this.subscription.add(
            this._dealer.get_search_dealer(e).subscribe((data) => {
                if (data.paging.entities.length > 0) {
                    this.dealers = data.paging.entities;
                    this.dealers_data = data.paging.entities;
                    this.loading_search = false;
                } else {
                    this.dealers_data = [];
                    // this.getDealers(1);
                    this.loading_search = false;
                }
                this.paging = data.paging;
            }),
        );
    }

    getDealers(e) {
        if (e > 1) {
            this.loading_data = true;
            this.subscription.add(
                this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
                    data.dealers.map((i) => {
                        this.dealers.push(i);
                    });
                    this.paging = data.paging;
                    this.loading_data = false;
                }),
            );
        } else {
            if (this.is_search) {
                this.loading_search = true;
            }
            this.subscription.add(
                this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
                    this.dealers = data.dealers;
                    this.dealers_data = data.dealers;
                    this.paging = data.paging;
                    this.loading_data = false;
                    this.loading_search = false;
                }),
            );
        }
    }

    setToDealer(e) {
        this.f.dealer.setValue(e);
    }

    searchBoxTrigger(event) {
        this.is_search = event.is_search;
        this.getDealers(event.page);
    }
}
