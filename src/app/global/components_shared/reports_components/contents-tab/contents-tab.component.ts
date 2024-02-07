import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { ContentService } from '../../../../global/services/content-service/content.service';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { UI_TABLE_CONTENT_METRICS } from '../../../../global/models/ui_table_content_metrics';
import {
    UI_ROLE_DEFINITION,
    UI_ROLE_DEFINITION_TEXT,
} from '../../../models/ui_role-definition.model';

@Component({
    selector: 'app-contents-tab',
    templateUrl: './contents-tab.component.html',
    styleUrls: ['./contents-tab.component.scss'],
})
export class ContentsTabComponent implements OnInit {
    contentsForm: FormGroup = this._form_builder.group({
        start_date: ['', Validators.required],
        end_date: ['', Validators.required],
    });

    content_metrics_table_column = [
        { name: 'Host Name', key: 'hostName' },
        { name: 'Play Count', key: 'hostPlaysTotal' },
        { name: 'Play Duration', key: 'hostDurationsTotal' },
    ];

    metrics_table_column = [
        { name: '#', sortable: false },
        { name: 'File Name' },
        { name: 'Playing Where' },
        { name: 'Total Play Count' },
        { name: 'Total Play Duration' },
    ];

    dealers_mode_export_column = [
        { name: 'Content Name', key: 'title' },
        { name: 'Host Name', key: 'hostName' },
        { name: 'Play Count', key: 'hostPlaysTotal' },
        { name: 'Play Duration', key: 'hostDurationsTotal' },
        { name: 'Total Play Count', key: 'playsTotal' },
        { name: 'Total Duration', key: 'durationsTotal' },
    ];

    content_metrics: Array<any> = [];
    content_to_export: Array<any> = [];
    dealers: API_DEALER[];
    dealers_content_to_export: any = [];
    dealers_data: Array<any> = [];
    dealer_id: string;
    dealer_name: string;
    dealer_not_found: boolean;
    end_date: Date;
    filtered_data: Array<any> = [];
    initial_load: boolean = true;
    is_dealer: boolean = false;
    is_loading: boolean = true;
    is_search: boolean = false;
    loading_data: boolean = true;
    loading_search: boolean = false;
    paging: any;
    paging_data: any;
    searching: boolean = false;
    start_date: Date;
    search_data: string = '';
    selected_content: string;
    selected_content_count: string;
    selected_content_duration: string;
    selected_content_name: string;
    selected_dealer: string;
    selected_dealer_name: string = '';
    subscription: Subscription = new Subscription();
    workbook: any;
    workbook_generation: boolean = false;
    worksheet: any;
    route: any;

    //needs to be string since it has to be some format for BE Query:
    start_date_for_query: string;
    end_date_for_query: string;

    constructor(
        private _form_builder: FormBuilder,
        private _dealer: DealerService,
        private _content: ContentService,
        private _auth: AuthService,
    ) {}

    ngOnInit() {
        this.getDealers(1);
        if (this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.dealer) {
            this.is_dealer = true;
            this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
            this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
            this.setDealerId(this.dealer_id);
        }

        this.route = this._auth.current_role;
        if (this.route === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            this.route = UI_ROLE_DEFINITION_TEXT.administrator;
        }
    }

    filterData(key) {
        if (key) {
            this.search_data = key;
        } else {
            this.search_data = '';
        }
        this.getMediaFiles(1);
    }

    onSelectStartDate(e) {
        this.start_date = e;
        this.start_date_for_query = moment(e).format('YYYY-MM-DD');
        if (this.end_date && this.selected_dealer) {
            this.getMediaFiles(1);
        }
    }

    onSelectEndDate(e) {
        this.end_date = e;
        this.end_date_for_query = moment(e).format('YYYY-MM-DD');
        if (this.start_date && this.selected_dealer) {
            this.getMediaFiles(1);
        }
    }

    getMetrics() {
        var tab = 'dealer';
        var filter = {
            dealerid: this.selected_dealer,
            from: this.start_date_for_query,
            to: this.end_date_for_query,
            contenttitle: this.search_data,
        };
        this.subscription.add(
            this._dealer.content_dealer_metrics(filter).subscribe((data) => {
                this.dealers_content_to_export = data.contentMetrics;
                this.dealers_content_to_export.forEach((item, i) => {
                    this.modifyItem(item, tab);
                    this.worksheet.addRow(item).font = {
                        bold: false,
                    };
                });
                this.generateExcel(tab);
            }),
        );
    }

    getContentMetrics() {
        var tab = 'contents';
        var filter = {
            contentid: this.selected_content,
            from: this.start_date_for_query,
            to: this.end_date_for_query,
            contenttitle: this.search_data,
        };
        this.subscription.add(
            this._content.get_content_metrics_export(filter).subscribe((data) => {
                this.content_to_export = data.contentMetricExports;
                this.content_to_export.forEach((item, i) => {
                    this.modifyItem(item, tab);
                    this.worksheet.addRow(item).font = {
                        bold: false,
                    };
                });
                this.generateExcel(tab);
            }),
        );
    }

    setContentSelected(data) {
        this.selected_content = data.id;
        this.selected_content_count = data.count;
        this.selected_content_duration = data.duration;
        this.selected_content_name = data.name;
        this.exportTable('contents');
    }

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

    getMediaFiles(e) {
        this.searching = true;
        var filter = {
            dealerid: this.selected_dealer,
            from: this.start_date_for_query,
            to: this.end_date_for_query,
            pageSize: 10,
            page: e,
            contenttitle: this.search_data,
        };
        this.subscription.add(
            this._content.get_content_metrics(filter).subscribe((data) => {
                this.searching = false;
                this.initial_load = false;
                this.paging_data = data.paging;
                if (!data.message) {
                    this.content_metrics = this.metrics_mapToUIFormat(data.contentMetrics);
                    this.filtered_data = this.metrics_mapToUIFormat(data.contentMetrics);
                } else {
                    this.content_metrics = [];
                    this.filtered_data = [];
                }
            }),
        );
    }

    metrics_mapToUIFormat(data) {
        let count = this.paging_data.pageStart;
        return data.map((i) => {
            return new UI_TABLE_CONTENT_METRICS(
                { value: count++, link: null, editable: false, hidden: false },
                { value: i.contentId, link: null, editable: false, hidden: true },
                {
                    value: i.title,
                    link: `/${this.route}/media-library/` + i.contentId,
                    new_tab_link: true,
                },
                {
                    value: i.hostsTotal + ' host(s)',
                    show_host: 'true',
                    host_list: i.hosts,
                    drop_link: `/${this.route}/hosts/`,
                },
                { value: i.playsTotal },
                { value: this.msToTime(i.durationsTotal) },
            );
        });
    }

    msToTime(input) {
        let totalSeconds = input;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        return hours + 'h ' + minutes + 'm ' + seconds + 's ';
    }

    generateExcel(options) {
        const EXCEL_TYPE =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        var filename = '';
        let rowIndex = 1;
        for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
            this.worksheet.getRow(rowIndex).alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true,
            };
        }
        this.workbook.xlsx.writeBuffer().then((file: any) => {
            const blob = new Blob([file], { type: EXCEL_TYPE });
            switch (options) {
                case 'dealer':
                    filename = this.selected_dealer_name + '-contents_report' + '.xlsx';
                    break;
                case 'contents':
                    filename = this.selected_content_name + '-_reports' + '.xlsx';
                    break;
                default:
            }
            saveAs(blob, filename);
        });
        this.workbook_generation = false;
    }

    modifyItem(item, tab) {
        switch (tab) {
            case 'dealer':
                item.playsTotal = item.playsTotal == 0 ? '' : item.playsTotal;
                item.durationsTotal =
                    item.durationsTotal == 0 ? '' : this.msToTime(item.durationsTotal);
                item.hostDurationsTotal =
                    item.hostDurationsTotal == 0 ? '' : this.msToTime(item.hostDurationsTotal);
                break;
            case 'contents':
                item.hostDurationsTotal =
                    item.hostDurationsTotal == 0 ? '' : this.msToTime(item.hostDurationsTotal);
                break;
            default:
        }
    }

    exportTable(tab) {
        const header = [];
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet(
            this.start_date_for_query + ' - ' + this.end_date_for_query,
        );
        switch (tab) {
            case 'dealer':
                this.workbook_generation = true;
                Object.keys(this.dealers_mode_export_column).forEach((key) => {
                    if (
                        this.dealers_mode_export_column[key].name &&
                        !this.dealers_mode_export_column[key].no_export
                    ) {
                        header.push({
                            header: this.dealers_mode_export_column[key].name,
                            key: this.dealers_mode_export_column[key].key,
                            width: 30,
                            style: { font: { name: 'Arial', bold: true } },
                        });
                    }
                });
                this.worksheet.columns = header;
                this.getMetrics();
                break;
            case 'contents':
                Object.keys(this.content_metrics_table_column).forEach((key) => {
                    if (
                        this.content_metrics_table_column[key].name &&
                        !this.content_metrics_table_column[key].no_export
                    ) {
                        header.push({
                            header: this.content_metrics_table_column[key].name,
                            key: this.content_metrics_table_column[key].key,
                            width: 30,
                            style: { font: { name: 'Arial', bold: true } },
                        });
                    }
                });
                const first_column = ['Filename', this.selected_content_name];
                this.worksheet.columns = header;
                // this.worksheet.duplicateRow(1, true);
                this.worksheet.getRow(1).values = [];
                this.worksheet.getRow(1).values = first_column;
                this.worksheet.getRow(2).values = [];
                const second_column = ['', 'Total Count', 'Total Duration'];
                this.worksheet.getRow(2).values = second_column;
                this.worksheet.getRow(2).height = 20;
                const third_column = [
                    '',
                    this.selected_content_count,
                    this.selected_content_duration,
                ];
                this.worksheet.getRow(3).values = third_column;
                this.worksheet.getRow(3).height = 20;
                this.worksheet.getRow(4).values = [];
                this.worksheet.getRow(4).height = 20;
                this.worksheet.getRow(5).values = ['Host', 'Play Count', 'Play Duration'];
                this.worksheet.getRow(5).height = 20;
                this.worksheet.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
                this.worksheet.getRow(2).font = {
                    bold: true,
                    name: 'Arial',
                    size: 11,
                };
                this.worksheet.mergeCells('B1:F1');
                this.worksheet.getCell('B1').alignment = { horizontal: 'left' };
                this.getContentMetrics();
                break;
            default:
        }
    }
}
