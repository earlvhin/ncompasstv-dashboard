import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSelect } from '@angular/material';
// import { LicenseService } from '../../../services/license-service/license.service';
import { API_CONTENT, API_BLOCKLIST_CONTENT, CREDITS, PLAYLIST_CHANGES, API_LICENSE } from 'src/app/global/models';
import { Subject } from 'rxjs';
import { API_DEALER, API_HOST } from 'src/app/global/models';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-license-modal',
    templateUrl: './target-license.component.html',
    styleUrls: ['./target-license.component.scss'],
})
export class TargetLicenseModal implements OnInit, OnDestroy {
    @ViewChild('dealerMultiSelect', { static: false }) dealerMultiSelect: MatSelect;
    dealerSelection = this._formBuilder.group({ selectedDealers: [[], Validators.required] });
    dealerFilterControl = new FormControl(null);
    isLoadingHosts = true;
    isSearching = false;
    selectedDealers: API_DEALER[];
    selectedHosts: API_HOST[];
    selectedDealersControl = this.dealerSelection.get('selectedDealers');

    

    constructor(
        private _formBuilder: FormBuilder,
    ) {}

    ngOnInit() {
        this.generate_license_form = this._form.group({
            dealer: ['', Validators.required],
            number_of_license: ['', Validators.required],
        });
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    // Convenience getter for easy access to form fields
    get formControls() {
        return this.generate_license_form.controls;
    }

    onRemoveDealer(index: number) {
        this.selectedDealersControl.value.splice(index, 1);
        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
        this.onSelectDealer();
    }
    
    onClearSelection() {
        this.selectedDealersControl.value.length = 0;
        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
        this.selectedDealers = [];
        this.unfilteredDealers = [];
        this.unfilteredLicenses = [];
        this.unfilteredHosts = [];
        this.mapMarkers = [];
    }
}
