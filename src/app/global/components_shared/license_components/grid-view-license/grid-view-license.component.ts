import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Router } from '@angular/router';
import { LicenseService, AuthService } from 'src/app/global/services';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-grid-view-license',
  templateUrl: './grid-view-license.component.html',
  styleUrls: ['./grid-view-license.component.scss']
})
export class GridViewLicenseComponent implements OnInit {

    @Input() license_data_for_grid_view: any;
    @Input() searching_licenses: any;
    @Input() favorites_list: any;
    @Input() no_licenses_result: any;
    @Input() paging_data_licenses: any;
    @Input() no_favorites: any;
    @Input() dealers_name = '';
    @Input() favorite_view: any;
    @Output() get_favorite = new EventEmitter();
    @Output() show_more = new EventEmitter();
    protected _unsubscribe = new Subject<void>();

    splitted_text: any;

    constructor(
        private _license: LicenseService,
        private _dialog: MatDialog,
        private router: Router,
        private _auth: AuthService,
    ) { }

    ngOnInit() {
        
    }

    ngOnChanges() {
        this.dealers_name = this.dealers_name;
        this.paging_data_licenses = this.paging_data_licenses;
        this.searching_licenses = this.searching_licenses;
        this.no_licenses_result = this.no_licenses_result;
        this.favorites_list = this.favorites_list;
        this.no_favorites = this.no_favorites;
        this.license_data_for_grid_view = this.license_data_for_grid_view;
    }

    removeToFavorites(license) {
        var id = license.licenseId;
        this._license
			.remove_license_favorite(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
                response => {
                    if(!response) {
                        this.openConfirmationModal('success', 'Success!', 'License successfully removed to Favorites');
                        this.license_data_for_grid_view.push(license);
                    } else {
                        this.openConfirmationModal('error', 'Error!', response.message);
                    }
                }
            )
    }

    addToFavorites(id) {
        this._license
			.add_license_favorite(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
                response => {
                    if(!response) {
                        this.license_data_for_grid_view = this.license_data_for_grid_view.filter((license) => {
					        return license.licenseId != id;
				        })
                        this.openConfirmationModal('success', 'Success!', 'License successfully added to Favorites');
                    } else {
                        this.openConfirmationModal('error', 'Error!', response.message);
                    }
                }
            )
    }

    openConfirmationModal(status, message, data): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialog.afterClosed().subscribe(() => {
            if(status === 'success') {
                this.get_favorite.emit(true)
            };
        });
	}

    checkStatus(license) {
		let currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		if (new Date(license.installDate) <= currentDate && license.isActivated === 1 && license.hostName && license.piStatus === 1) {
			return 'text-primary';
		} else if (new Date(license.installDate) <= currentDate && license.isActivated === 1 && license.hostName && license.piStatus === 0) {
			return 'text-danger';
		} else if (new Date(license.installDate) > currentDate && license.hostName && license.isActivated === 1) {
			return 'text-orange';
		} else if (license.isActivated === 0 && license.hostName) {
			return 'text-light-gray';
		} else {
			return 'text-gray';
		}
	}

    showMore(page, pageSize) {
        let filter = {
            page: page,
            pageSize: pageSize
        }
        this.show_more.emit(filter)
    }

    navigateToDealer(id) {
        const url = this.router.serializeUrl(this.router.createUrlTree([`/${this.roleRoute}/dealers/${id}`], {}));
		window.open(url, '_blank');
    }
    
    navigateToHost(id) {
        const url = this.router.serializeUrl(this.router.createUrlTree([`/${this.roleRoute}/hosts/${id}`], {}));
		window.open(url, '_blank');
    }

    protected get roleRoute() {
		return this._auth.roleRoute;
	}

    navigateToAlias(id) {
        const url = this.router.serializeUrl(this.router.createUrlTree([`/${this.roleRoute}/licenses/${id}`], {}));
		window.open(url, '_blank');
    }

    formulateScreenshotURL(url) {
        return `${environment.base_uri}${url.replace('/API/', '')}`;
    }

    copyToClipboard(val: string) {
		//create artificial textbox for selector
		const selBox = document.createElement('textarea');
		selBox.style.position = 'fixed';
		selBox.style.left = '0';
		selBox.style.top = '0';
		selBox.style.opacity = '0';
		selBox.value = val;
		document.body.appendChild(selBox);
		selBox.focus();
		selBox.select();
		document.execCommand('copy');
		document.body.removeChild(selBox);
	}

    
    getAnydeskPassword(id) {
        return this.splitKey(id)
    }

    splitKey(key) {
		this.splitted_text = key.split('-');
		return this.splitted_text[this.splitted_text.length - 1];
	}
}
