import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil} from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { API_HOST } from '../../../models/api_host.model';
import { API_LICENSE_PROPS } from '../../../models/api_license.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { HostService } from '../../../services/host-service/host.service';
import { LicenseService } from '../../../services/license-service/license.service';
import { UI_HOST_LOCATOR_MARKER } from '../../../models/ui_host-locator.model';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { PAGING } from 'src/app/global/models/paging.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { AgmInfoWindow } from '@agm/core';

@Component({
	selector: 'app-host-view',
	templateUrl: './host-view.component.html',
	styleUrls: ['./host-view.component.scss']
})
export class HostViewComponent implements OnInit, OnDestroy {
	
    categories_data: any[] = [];
    category_paging: PAGING;
    currentRole: string;
    currentSearchOption: string;
	hosts_data: API_HOST[] = [];
    host_results: API_HOST[] = [];
    is_dealer = false;
    isFormReady = false;
    loading_category_data = false;
	loading_category_search = false;
    loading_data = false;
	loading_search = false;
	loading_state_data = false;
	loading_state_search = false;
	paging: PAGING;
	primaryKeyword: string = 'hostName';
	searchDealerId: string = '';
    searchSelectForm: FormGroup;
    search_category_key = '';
	search_hosts_data: API_HOST[] = [];
	search_key = '';
	search_state_key = '';
	state_paging: PAGING;
    states_data: any[] = [];
	unfiltered_host_results: API_HOST[] = [];
    status: boolean = false;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
        private _auth: AuthService, 
        private _host: HostService, 
        private _license: LicenseService, 
        private _router: Router,
        private _formBuilder: FormBuilder
    ) {}

	ngOnInit() {
        this.initializeForm();
		this.currentSearchOption = 'host';
		if (this.currentUserIsDealer) this.is_dealer = true;
		this.currentRole = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
		if (this.currentRole === 'dealer') {
			this.primaryKeyword = 'name';
		}
		this.getHosts(1);
		this.getHostCategories(1);
		this.getHostStates(1);
	}

    toggleOverMap() {
        this.status = !this.status; 
    }

    private initializeForm(): void {
		this.searchSelectForm = this._formBuilder.group({
			hostList: [[], Validators.required],
			searchHostKeyword: null
		});

		this.isFormReady = true;
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	createHostPlace() {
		this._router.navigate([`/${this.currentRole}/hosts/create-host/`]);
	}

    onSearchOption(key: string) {
		if (key === 'host') {
			this.currentSearchOption = 'host';
            this.status = false;
		} else if (key === 'state') {
			this.currentSearchOption = 'state';
            this.status = false;
			this.getHostStates(1);
		} else if (key === 'category') {
			this.currentSearchOption = 'category';
            this.status = false;
			this.getHostCategories(1);
		}
	}

	private getHosts(page: number) {
		let search = this.search_key ? this.search_key : this.search_category_key;
		search = search ? search : this.search_state_key;
		this.host_results = [];
		this.unfiltered_host_results = [];
		if (this.currentUserIsDealer) {
			const currentDealerId = this.currentUser.roleInfo.dealerId;
			this._host.get_host_by_dealer_id(currentDealerId, page, search).subscribe(
                response => {
                    if(!response.message) {
                        this.hosts_data = response.paging.entities.filter( host => host.totalLicenses > 0)
                    } else {
                        this.hosts_data = [];
                    }
                }
            );
		} else {
            this._host.get_host_by_page(page, this.search_key, '', '', 0).subscribe(
                response => {
                    console.log("RES", response)
                    if(this.search_key) {
                        this.search_hosts_data = response.host.filter( host => host.totalLicenses > 0)
                    } else {
                        this.hosts_data = response.host.filter( host => host.totalLicenses > 0)
                    }
                }
            )
        }
		if (this.search_key) {
			this.loading_search = true;
			this.hosts_data = [];
		} else this.loading_data = true;    
	}

	getHostStates(page: number) {
		this.searchDealerId = '';
		if (this.currentUserIsDealer) {
			this.searchDealerId = this.currentUser.roleInfo.dealerId;
		}
		this._host
			.get_host_states(page, this.search_state_key, this.searchDealerId, 0)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { state: any[]; paging: PAGING; message?: string }) => {
					// no records found
					if (response.message) return;

					const { paging } = response;
					const { entities } = paging;
					const states: any[] = entities;
					this.states_data = [];

					states.map((state) => {
						this.states_data.push(state);
					});

					this.state_paging = paging;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.loading_state_search = false;
				this.loading_state_data = false;
			});
	}

	getHostCategories(page: number) {
		this.searchDealerId = '';
		if (this.currentUserIsDealer) {
			this.searchDealerId = this.currentUser.roleInfo.dealerId;
		}
		this._host
			.get_host_categories(page, this.search_category_key, this.searchDealerId, 0)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { category: any[]; paging: PAGING; message?: string }) => {
					// no records found
					if (response.message) return;

					const { paging } = response;
					const { entities } = paging;
					const categories: any[] = entities;
					this.categories_data = [];

					categories.map((category) => {
                        if(category.totalLicenses > 0) {
                            this.categories_data.push(category);
                        }
					});

					this.category_paging = paging;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.loading_category_search = false;
				this.loading_category_data = false;
			});
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentUserIsDealer() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.dealer;
	}
}
