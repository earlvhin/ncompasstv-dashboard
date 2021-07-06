import { Component, OnInit, Inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { API_HOST } from '../../../models/api_host.model';
import { API_DEALER } from '../../../models/api_dealer.model';
import { API_ADVERTISER } from '../../../models/api_advertiser.model';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { HostService } from '../../../services/host-service/host.service';
import { ContentService } from '../../../services/content-service/content.service';
import { AdvertiserService } from '../../../services/advertiser-service/advertiser.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { timeStamp } from 'console';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-media-modal',
	templateUrl: './media-modal.component.html',
	styleUrls: ['./media-modal.component.scss']
})

export class MediaModalComponent implements OnInit {
	
	advertiser: API_ADVERTISER[] = [];
	advertiserid: string;
	advertiser_data: Array<any> = [];
	advertiser_name: string = "";
	advertiser_field_disabled: boolean = true;
	assign_data = {
		dealer:'',
		host:'',
		advertiser:''
	}
	content_data: any;
	dealerid: string;
	dealers: any = [];
	dealer_name: string = "";
	dealers_data: any = [];
	filter: any = [];
	hostid: string;
	host_name: string = "";
	hosts_data: Array<any> = [];
	host_field_disabled: boolean = true;
	hosts: API_HOST[] = [];
	initial_load: boolean = false;
	initial_load_host: boolean = false;
	initial_load_advertiser: boolean = false;
	is_dealer: boolean = false;
	is_floating: boolean = false;
	is_search: boolean = false;
	is_search_host: boolean = false;
	is_search_advertiser: boolean = false;
	loading_data: boolean = true;
	loading_data_advertiser: boolean = false;
	loading_data_host: boolean = false;
	loading_form: boolean = false;
	loading_search: boolean = false;
	loading_search_advertiser: boolean = false;
	loading_search_host: boolean = false;
	no_advertiser_found: boolean = true;
	no_dealer: boolean = true;
	no_dealer_data: boolean;
	no_host_found: boolean = true;
	paging: any;
	paging_advertiser: any;
	paging_host: any;
	search_advertiser_data: string = "";
	search_dealer_data: string = "";
	search_host_data: string = "";
	subscription: Subscription = new Subscription;	
	temp: any = {};
	temp_dname: "";
	_is_edit: any;
	to_empty: boolean = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data_before_modal: any,
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _content: ContentService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _host: HostService,
	) { }
	
	ngOnInit() {
		this.getDealers(1);

		if (this.data_before_modal) {
			this._is_edit = this.data_before_modal[0].is_edit;
		} else {
			this._is_edit = false;
		}

		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];
		
		// for dealer_users auto fill
		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.dealerid = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.dealerSelected(this.dealerid);
		} else {
			if(this._is_edit) {
				this.subscription.add(
					this._content.get_content_by_id(this.data_before_modal[1].id).subscribe(
						data => {
							this.content_data = data;
							if(this.content_data.fileType != 'feed') {
								if(this.content_data.dealerId == "" && this.content_data.advertiserId == "" && this.content_data.hostId == "") {
									this.is_floating = true;
								} else {
									this.hostid = data.hostId;
									this.getHostName(this.hostid);
									this.advertiserid = data.advertiserId;
									this.getAdvertiserName(this.advertiserid);
									this.dealerid = data.dealerId;
									this.getDealerName(data.dealerId);
								}
							} else {
								if(this.content_data.dealerId == "") {
									this.is_floating = true;
								} else {
									this.dealerid = data.dealerId;
									this.getDealerName(data.dealerId);
								}
							}
						}
					)
				)
			}
		}
	}

	floatingToggle(e) {
		this.is_floating = e.checked;
		
		//clear data
		if(this.is_floating) {
			this.temp = {
				hostid : this.hostid,
				host_name : this.host_name,
				advertiserid : this.advertiserid,
				advertiser_name : this.advertiser_name,
				dealerid : this.dealerid,
				dealer_name : this.dealer_name
			}
			this.hostid = "";
			this.host_name = "";
			this.advertiserid = "";
			this.advertiser_name = "";
			this.dealerid = "";
			this.dealer_name = "";
			this.no_advertiser_found = true;
			this.no_host_found = true;
		} else {
			if(this.content_data.dealerId != "" && this.content_data.advertiserid != "" && this.content_data.hostid != "") {
				this.hostid = this.temp.hostid;
				this.advertiserid = this.temp.advertiserid;
				this.dealerid = this.temp.dealerid;
				this.getHostName(this.hostid);
				this.getAdvertiserName(this.advertiserid);
				this.getDealerName(this.dealerid);
			}
		}
	}

	checkInitialLoad() {
		if(this._is_edit) {
			if(!this.is_floating) {
				if(this.dealers && this.hosts && this.advertiser && this.dealer_name) {
					return true;
				}
				if(this.content_data) {
					if(this.dealers && this.content_data.fileType == 'feed') {
						return true;
					}
					if(this.content_data.dealerId == "" && this.content_data.advertiserId == "" && this.content_data.hostId == "") {
						return true;
					}
				}
			} else {
				return true;
			}
			
		} else {
			if(this.dealers.length > 0) {
				return true;
			}
		}
	}

	updateData() {
		if(!this.is_floating) {
			var filter = {
				contentid: this.content_data.contentId,
				dealerid: this.assign_data.dealer,
				hostid: this.assign_data.host,
				advertiserid: this.assign_data.advertiser
			}
		} else {
			var filter = {
				contentid: this.content_data.contentId,
				dealerid: this.dealerid,
				hostid: this.hostid,
				advertiserid: this.advertiserid
			}
		}
		
		this.filter.push(filter)
		// if(this.is_floating) {
		this._content.unassign_content(this.filter).subscribe(
			data => {
				if(data) {
					this.confirmationModal('success', 'Content assignment successfully edited.','Click OK to continue');
				}
			}
		)
		// }
	}

	confirmationModal(status, message, data) {
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: status,
				message: message,
				data: data
			}
		})

		dialogRef.afterClosed().subscribe(
			data => {
				this._dialog.closeAll();
			}
		)
	}

	getDealerName(e) {
		this.subscription.add(
			this._dealer.get_dealer_by_id(e).subscribe(
				data => {
					this.dealer_name = data.businessName;
					this.temp_dname = data.dealerId;
					this.dealerSelected(data.dealerId);
				}
			)
		)
	}

	getHostName(e) {
		this.subscription.add(
			this._host.get_host_by_id(e).subscribe(
				data => {
					if(!data.message) {
						this.host_name = data.host.name;
						this.hostSelected(data.host.hostId);
					}
					
				}
			)
		)
	}

	getAdvertiserName(e) {
		this.subscription.add(
			this._advertiser.get_advertiser_by_id(e).subscribe(
				data => {
					if(data) {
						this.advertiser_name = data.name;
						this.advertiserSelected(data.id);
					}
				}
			)
		)
	}

	searchData(e) {
		this.search_dealer_data = e;
		this.getDealers(1);
	}

	getDealers(e) {
		if(e > 1) {
			this.loading_data = true;
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, this.search_dealer_data).subscribe(
					data => {
						data.dealers.map (
							i => {
								this.dealers.push(i)
								this.dealers_data.push(i)
							}
						)
						this.paging = data.paging;
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			)
		} else {
			if(this.search_dealer_data != "") {
				this.loading_search = true;
				this.dealers_data = [];
			}
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, this.search_dealer_data).subscribe(
					data => {
						if(data.dealers.length > 0) {
							data.dealers.map (
								i => {
									this.dealers.push(i)
									this.dealers_data.push(i)
								}
							)
							this.paging = data.paging;
						}
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			)
		}
	}

	searchBoxTrigger (event) {
		this.is_search = event.is_search;
		if(this.is_search) {
			this.search_dealer_data = "";
			this.dealers_data = [];
			this.loading_search = true;
			this.assign_data.dealer = '';
			this.assign_data.host = '';
			this.assign_data.advertiser = '';
		}
		if(this.paging.hasNextPage || this.is_search) {
			this.getDealers(event.page);	
		}
	}

	hostSearchBoxTrigger (event) {
		this.is_search_host = event.is_search;
		if(this.is_search_host) {
			this.search_host_data = "";
			this.hosts_data = [];
			this.loading_search_host = true;
		}
		if(this.paging_host.hasNextPage || this.is_search_host) {
			this.getHostByDealerId(event.page);	
		}
	}

	advertiserSearchBoxTrigger (event) {
		this.is_search_advertiser = event.is_search;
		if(this.is_search_advertiser) {
			this.search_advertiser_data = "";
			this.advertiser_data = [];
			this.loading_search_advertiser = true;
		}
		if(this.paging.hasNextPage || this.is_search_advertiser) {
			this.getAdvertiserByDealerId(event.page);
		}
	}

	searchHostData(e) {
		this.search_host_data = e;
		this.getHostByDealerId(1);
	}
	
	searchAdvertiserData(e) {
		this.search_advertiser_data = e;
		this.getAdvertiserByDealerId(1);
	}

	dealerSelected(e) {
		this.loading_form = true;
		this.no_dealer = false;
		this.assign_data.dealer = e;
		this.initial_load_host = false;
		if(this._is_edit) {
			this.loading_data = false;
			if(this.content_data.fileType != 'feed') {
				this.hosts = [];
				this.hosts_data = [];
				this.advertiser_data = [];
				this.advertiser = [];
				this.assign_data.host = "";
				this.host_name = "";
				this.assign_data.advertiser = "";
				this.advertiser_name = "";
				this.to_empty = true;
				this.loading_form = true;
				this.getHostByDealerId(1);
				this.getAdvertiserByDealerId(1);
			}
			if(e != this.temp_dname) {
				// this.loading_search = true;
				
				this.assign_data.host = "";
				this.host_name = "";
				this.assign_data.advertiser = "";
				this.advertiser_name = "";
			}
		} else {
			this.hosts = [];
			this.hosts_data = [];
			this.advertiser_data = [];
			this.advertiser = [];
			this.assign_data.host = "";
			this.host_name = "";
			this.assign_data.advertiser = "";
			this.advertiser_name = "";
			this.to_empty = true;
			this.loading_form = true;
			this.getHostByDealerId(1);
			this.getAdvertiserByDealerId(1);
		}
	}

	getHostByDealerId(e) {
		if(e > 1) {
			this.loading_data_host = true;
			this.subscription.add(
				this._host.get_host_by_dealer_id(this.assign_data.dealer, e, this.search_host_data).subscribe(
					data => {
						data.paging.entities.map (
							i => {
								this.hosts.push(i);
								this.hosts_data.push(i);
							}
						)
						this.paging_host = data.paging;
						this.loading_data_host = false;
						this.loading_search_host = false;
					}
				)
			)
		} else {
			if(this.search_host_data != "") {
				this.loading_search_host = true;
				this.hosts_data = [];
			}
			this.subscription.add(
				this._host.get_host_by_dealer_id(this.assign_data.dealer, e, this.search_host_data).subscribe(
					data => {
						if(!data.message) {
							data.paging.entities.map (
								i => {
									this.hosts.push(i)
									this.hosts_data.push(i)
								}
							)
							this.paging_host = data.paging;
							this.no_host_found = false;
						}
						this.to_empty = false;
						this.loading_data_host= false;
						this.loading_search_host = false;
						this.loading_form = false;
					}
				)
			)
		}
	}

	hostSelected(e) {
		this.assign_data.host = e;
	}

	getAdvertiserByDealerId(e) {
		if(e > 1) {
			this.loading_data_advertiser = true;
			this.subscription.add(
				this._advertiser.get_advertisers_by_dealer_id(this.assign_data.dealer, e, this.search_advertiser_data).subscribe(
					data => {
						data.advertisers.map (
							i => {
								this.advertiser.push(i);
								this.advertiser_data.push(i);
							}
						)
						this.paging_advertiser = data.paging;
						this.loading_data_advertiser = false;
						this.loading_search_advertiser = false;
					}
				)
			)
		} else {
			if(this.search_advertiser_data != "") {
				this.loading_search_advertiser = true;
				this.advertiser_data = [];
			}
			this.subscription.add(
				this._advertiser.get_advertisers_by_dealer_id(this.assign_data.dealer, e, this.search_advertiser_data).subscribe(
					data => {
						if(!data.message) {
							data.advertisers.map (
								i => {
									this.advertiser.push(i);
									this.advertiser_data.push(i);
								}
							)
							this.paging_advertiser = data.paging;
							this.no_advertiser_found = false;
						}
						this.to_empty = false;
						this.loading_data_advertiser = false;
						this.loading_search_advertiser = false;
						this.loading_form = false;
					}
				)
			)
		}
	}

	advertiserSelected(e) {
		this.assign_data.advertiser = e;
	}

	onNoClick() {
		this
	}
}
