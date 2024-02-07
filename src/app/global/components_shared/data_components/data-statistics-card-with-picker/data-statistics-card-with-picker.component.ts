import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import * as moment from 'moment';

@Component({
    selector: 'app-data-statistics-card-with-picker',
    templateUrl: './data-statistics-card-with-picker.component.html',
    styleUrls: ['./data-statistics-card-with-picker.component.scss'],
})
export class DataStatisticsCardWithPickerComponent implements OnInit {
    dealers: API_DEALER[];
    dealers_data: Array<any> = [];
    dealer_not_found: boolean;
    end_date: Date;
    is_loading: boolean = true;
    is_search: boolean = false;
    loading_data: boolean = true;
    loading_search: boolean = false;
    clear_dealer: boolean = false;
    paging: any;
    searching: boolean = false;
    selected_dealer: string;
    selected_dealer_name: string = '';
    start_date: Date;

    //needs to be string since it has to be some format for BE Query:
    start_date_for_query: string;
    end_date_for_query: string;

    subscription: Subscription = new Subscription();
    is_date_valid: boolean = false;
    is_valid_onchange: boolean = false;

    contentsForm: FormGroup = this._form_builder.group({
        start_date: ['', Validators.required],
        end_date: ['', Validators.required],
    });

    @Input() id: string;
    @Input() sub_title: string;
    @Input() total: string;
    @Input() label_array: [];
    @Input() value_array: [];
    @Input() month_array: [];
    @Input() whole_data: [];
    @Input() generate_chart: boolean;
    @Input() num_of_months: string;
    @Input() average: string;
    @Input() installation: boolean = false;
    @Input() total_dealer: boolean = false;
    @Input() detailed: boolean = false;

    @Output() s_date: EventEmitter<any> = new EventEmitter();
    @Output() e_date: EventEmitter<any> = new EventEmitter();
    @Output() dealer_selected: EventEmitter<any> = new EventEmitter();

    no_data: boolean = false;

    constructor(
        private _form_builder: FormBuilder,
        private _dealer: DealerService,
    ) {}

    ngOnInit() {
        if (this.value_array.length == 0) {
            this.no_data = true;
        }
        this.getDealers(1);
    }

    ngOnChanges() {
        // this.generate_chart = this.generate_chart;
    }

    unselectDealer() {
        this.selected_dealer = '';
        this.selected_dealer_name = '';
        this.clear_dealer = true;
        this.dealer_selected.emit('');
    }

    setDealerId(e) {
        if (e) {
            this.selected_dealer = e;
            this.getDealerDetails(e);
            this.checkIfCompleteData();
            this.dealer_not_found = false;
        } else {
            this.dealer_not_found = true;
        }
    }

    dateFilter = (date: Date | null): boolean => {
        if (!this.installation) {
            return true;
        }

        if (!date || !this.start_date) {
            return true;
        }

        this.is_date_valid =
            this.calculateDateDifference(this.start_date, date.toISOString()) <= 365;
        return this.is_date_valid;
    };

    onSelectStartDate(e) {
        this.start_date = e;
        this.start_date_for_query = moment(e).format('YYYY-MM-DD');
        this.checkIfCompleteData();
    }

    onSelectEndDate(e) {
        this.end_date = e;
        this.end_date_for_query = moment(e).format('YYYY-MM-DD');
        this.updateValidity();
        this.checkIfCompleteData();
    }

    checkIfCompleteData() {
        if (this.selected_dealer) {
            this.dealer_selected.emit(this.selected_dealer);
        } else if (this.end_date && this.start_date) {
            this.s_date.emit(this.start_date_for_query);
            this.e_date.emit(this.end_date_for_query);
            this.updateValidity();
        } else {
        }
    }

    updateValidity() {
        if (this.start_date && this.end_date) {
            const dateDifference = this.calculateDateDifference(this.start_date, this.end_date);
            this.is_valid_onchange = dateDifference <= 365;
        }
    }

    calculateDateDifference(startDate: any, endDate: any): number {
        const msPerDay = 24 * 60 * 60 * 1000;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return (end.getTime() - start.getTime()) / msPerDay;
    }

    getGraphPoints(e) {}

    getDealers(e) {
        this.loading_data = true;
        if (e > 1) {
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
                    this.is_loading = false;
                    this.loading_data = false;
                    this.loading_search = false;
                }),
            );
        }
    }

    searchBoxTrigger(event) {
        this.is_search = event.is_search;
        this.getDealers(event.page);
    }

    getDealerDetails(e) {
        this.subscription.add(
            this._dealer.get_dealer_by_id(e).subscribe((data) => {
                this.selected_dealer_name = data.businessName;
            }),
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
                    this.loading_search = false;
                }
                this.paging = data.paging;
            }),
        );
    }
}
