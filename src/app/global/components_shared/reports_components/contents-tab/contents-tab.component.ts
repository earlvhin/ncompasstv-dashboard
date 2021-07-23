import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { Subscription } from 'rxjs';

import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { ContentService } from '../../../../global/services/content-service/content.service';
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { UI_TABLE_CONTENT_METRICS } from '../../../../global/models/ui_table_content_metrics';


@Component({
  selector: 'app-contents-tab',
  templateUrl: './contents-tab.component.html',
  styleUrls: ['./contents-tab.component.scss']
})
export class ContentsTabComponent implements OnInit {
    contentsForm: FormGroup = this._form_builder.group({ 
		start_date: [ '', Validators.required ],
		end_date: [ '', Validators.required ],
	});

    metrics_table_column = [
        { name: '#', sortable: false},
        { name: 'File Name'},
        { name: 'Playing Where'},
        { name: 'Total Play Count'},
        { name: 'Total Play Duration'},
	];
    
    content_metrics: Array<any> = [];
    dealers: API_DEALER[];
	dealers_data: Array<any> = [];
    dealer_not_found: boolean;
    end_date: Date;
    filtered_data: Array<any> = [];
    initial_load: boolean = true;
    is_loading: boolean = true;
	is_search: boolean = false;
    loading_data: boolean = true;
	loading_search: boolean = false;
    paging: any;
    paging_data: any;
    searching: boolean = false;
    start_date: Date;
    selected_dealer: string;
    selected_dealer_name: string = "";
    subscription: Subscription = new Subscription();

    constructor(
        private _form_builder: FormBuilder,
        private _dealer: DealerService,
        private _content: ContentService,
    ) { }

    ngOnInit() {
        this.getDealers(1);
    }

    onSelectStartDate(e) {
        this.start_date = e.format('YYYY-MM-DD');
        if(this.end_date && this.selected_dealer) {
            this.getMediaFiles(1);
        }
    }

    onSelectEndDate(e) {
        this.end_date = e.format('YYYY-MM-DD');
        if(this.start_date && this.selected_dealer) {
            this.getMediaFiles(1);
        }
    }

    getDealers(e) {
		this.loading_data = true;
		if(e > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						data.dealers.map (
							i => {
								this.dealers.push(i)
							}
						)
						this.paging = data.paging;
						this.loading_data = false;
					}
				)
			)
		} else {
			if(this.is_search) {
				this.loading_search = true;
			}
			
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						this.dealers = data.dealers;
						this.dealers_data = data.dealers;
						this.paging = data.paging
						this.is_loading = false;
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			)
		}
	}

    searchBoxTrigger(event) {
		this.is_search = event.is_search;
		this.getDealers(event.page);		
	}

    setDealerId(e) {
		if (e) {
			this.selected_dealer = e;
            this.getDealerDetails(e);
            this.getMediaFiles(1);
			this.dealer_not_found = false;
		} else {
			this.dealer_not_found = true;
		}
	}

    getDealerDetails(e) {
        this.subscription.add(
			this._dealer.get_dealer_by_id(e).subscribe(
                data => {
                    this.selected_dealer_name = data.businessName;
                }
            )
        )
    }

    searchData(e) {
		this.loading_search = true;
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe(
				data => {
					if (data.paging.entities.length > 0) {
						this.dealers = data.paging.entities;
						this.dealers_data = data.paging.entities;
						this.loading_search = false;
					} else {
						this.dealers_data = [];
						this.loading_search = false;
					}
					this.paging = data.paging;
				}
			)
		)
	}

    getMediaFiles(e) {
        this.searching = true;
        var filter = {
            dealerid: this.selected_dealer,
            from: this.start_date,
            to: this.end_date,
            pageSize: 10,
            page: e
        }

        this.subscription.add(
            this._content.get_content_metrics(filter).subscribe(
                data => {
                    this.searching = false;
                    this.initial_load = false;
                    this.paging_data = data.paging;
                    if(!data.message) {
						this.content_metrics = this.metrics_mapToUIFormat(data.contentMetrics);
						this.filtered_data = this.metrics_mapToUIFormat(data.contentMetrics);
					} else {
						this.content_metrics=[];
						this.filtered_data = [];
					}	
                }
            )
        )
    }

    metrics_mapToUIFormat(data) {
		let count = this.paging_data.pageStart;
		return data.map(
			i => {
				return new UI_TABLE_CONTENT_METRICS(
					{ value:count++, link: null , editable: false, hidden: false},
					{ value:i.title, link: '/administrator/media-library/'+ i.contentId, new_tab_link: 'true'},
					{ value:i.hostsTotal + ' host(s)', show_host: 'true', host_list: i.hosts},
					{ value:i.playsTotal},
					{ value:this.msToTime(i.durationsTotal)},
				)
			}
		)
	}

    msToTime(input) {
        var totalHours, totalMinutes, totalSeconds, hours, minutes, seconds, result='';
        totalSeconds = input / 1000;
        totalMinutes = totalSeconds / 60;
        totalHours = totalMinutes / 60;

        seconds = Math.floor(totalSeconds) % 60;
        minutes = Math.floor(totalMinutes) % 60;
        hours = Math.floor(totalHours) % 60;

        if (hours !== 0) {
            result += hours+'h ';
            if (minutes.toString().length == 1) {
                minutes = '0'+minutes;
            }
        }

        result += minutes+'m ';

        if (seconds.toString().length == 1) {
            seconds = '0'+seconds;
        }

        result += seconds + 's';
        return result;
    }
}
