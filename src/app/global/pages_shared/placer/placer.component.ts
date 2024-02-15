import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';

import * as moment from 'moment';
import { Moment } from 'moment';
import { FormControl } from '@angular/forms';

//UPLOAD TODO COMPONENT SOON
import * as filestack from 'filestack-js';
import { environment } from 'src/environments/environment';

import { UI_PLACER_DATA, WORKSHEET } from 'src/app/global/models';
import { PlacerService, HostService, ExportService } from 'src/app/global/services';
import { API_PLACER } from '../../models/api_placer.model';

@Component({
    selector: 'app-placer',
    templateUrl: './placer.component.html',
    styleUrls: ['./placer.component.scss'],
})
export class PlacerComponent implements OnInit {
    @Input() host_id: string = '';

    placer_table_column = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Placer Id', key: 'placerId' },
        { name: 'Placer Name', key: 'placerName', sortable: true, column: 'PlacerName' },
        { name: 'Host Name', key: 'hostName', sortable: true, column: 'HostName', unassigned: false },
        { name: 'Host ID', key: 'hostId', no_show: true, hidden: true, unassigned: false },
        { name: 'Unassigned Host', key: 'unassignedHost', no_show: true, hidden: true, color: 'red' },
        { name: 'Dealer', key: 'dealerName', no_show: true, hidden: true, unassigned: false },
        { name: 'Category', key: 'category', no_show: true, hidden: true, unassigned: false },
        { name: 'General Category', key: 'generalCategory', no_show: true, hidden: true, unassigned: false },
        { name: 'Address', key: 'address', sortable: true, column: 'Address', unassigned: false },
        { name: 'City', key: 'hostCity', no_show: true, hidden: true, unassigned: false },
        { name: 'State', key: 'hostState', no_show: true, hidden: true, unassigned: false },
        { name: 'Zip Code', key: 'postalCode', no_show: true, hidden: true, unassigned: false },
        { name: 'Longitude', key: 'longitude', no_show: true, hidden: true, unassigned: false },
        { name: 'Latitude', key: 'latitude', no_show: true, hidden: true, unassigned: false },
        { name: 'Foot Traffic', key: 'footTraffic', sortable: true, column: 'FootTraffic' },
        {
            name: 'Average Dwell Time',
            key: 'averageDwellTime',
            sortable: true,
            column: 'AverageDwellTime',
        },
        { name: 'Month', key: 'month', sortable: true, column: 'Month' },
        { name: 'Upload Date', key: 'dateUploaded', sortable: true, column: 'DateUploaded' },
        { name: 'Uploaded By', key: 'uploadedBy' },
        {
            name: 'Publication Date',
            key: 'publicationDate',
            sortable: true,
            column: 'PublicationDate',
        },
        { name: 'Source File', key: 'sourceFile' },
        { name: 'Action', sortable: false, no_export: true },
    ];

    date = new FormControl(moment());
    hostsData = [];
    placer_data: any[] = [];
    filtered_placer_data: any[] = [];
    filter: any = {
        assignee: '0',
        assignee_label: '',
        date_from: '',
        date_from_label: '',
        date_to: '',
        date_to_label: '',
    };
    host_name: string = '';
    initial_load_placer: boolean = false;
    original_placer_table_column: any[];
    placer_to_export: any[] = [];
    paging_data: any;
    searching_placer_data: boolean = true;
    search_keyword: string = '';
    sort_column: string = '';
    sort_order: string = '';
    total_placer: number = 0;
    unassigned_hosts: any[] = [];

    //Export
    workbook_generation = false;
    worksheet: WORKSHEET[];

    today: Date = new Date();
    pickerDateFrom = '';
    pickerDateTo = '';
    @ViewChild('pickerfrom', { static: false }) datePickerFrom: MatDatepicker<any>;
    @ViewChild('pickerto', { static: false }) datePickerTo: MatDatepicker<any>;

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _placer: PlacerService,
        private _date: DatePipe,
        private _host: HostService,
        private _export: ExportService,
    ) {}

    ngOnInit() {
        this.original_placer_table_column = this.placer_table_column;
        if (this.host_id != '') {
            this._host
                .get_host_by_id(this.host_id)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe((data) => (this.host_name = data.host.name));
        }
        this.checkForApiToCall();
        this.getHosts();
    }

    public checkForApiToCall(page?, for_export?) {
        if (this.host_id != '') return this.getPlacerForHost(page ? page : 1, for_export);
        this.getPlacerData(page ? page : 1, for_export);
    }

    private getPlacerForHost(page, is_export?) {
        if (!is_export) this.searching_placer_data = true;
        this._placer
            .get_single_host_placer(
                this.host_id,
                page,
                this.search_keyword,
                this.sort_column,
                this.sort_order,
                this.filter.assignee,
                this.filter.date_from,
                this.filter.date_to,
                15,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                this.searching_placer_data = false;
                this.mapData(data, is_export);
            })
            .add(() => {
                if (is_export) this.readyForExport();
            });
    }

    private getHosts() {
        this._host
            .get_host_minified()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((hosts) => {
                this.hostsData = hosts.map((host) => {
                    return {
                        id: host.hostId,
                        value: `${host.name} | ${host.address}, ${host.city}`,
                    };
                });
            });
    }

    private getPlacerData(page, is_export?) {
        if (!is_export) this.searching_placer_data = true;
        this._placer
            .get_all_placer(
                page,
                this.search_keyword,
                this.sort_column,
                this.sort_order,
                this.filter.assignee,
                this.filter.date_from,
                this.filter.date_to,
                is_export ? 0 : 15,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                this.searching_placer_data = false;
                this.mapData(data, is_export);
            })
            .add(() => {
                if (is_export) this.readyForExport();
            });
    }

    private mapData(placer_data, is_export) {
        if (placer_data.message) {
            this.placer_data = [];
            this.filtered_placer_data = [];
            this.paging_data = [];
            this.total_placer = 0;
            return;
        }

        if (is_export) {
            this.placer_to_export = [...placer_data.paging.entities];
            this.modifyDataForExport(this.placer_to_export);

            //to concat exceeded unassignedhost IF its greater than placer data count
            if (this.unassigned_hosts.length > this.placer_to_export.length) {
                for (let i = this.placer_to_export.length; i < this.unassigned_hosts.length; i++) {
                    this.placer_to_export.push({
                        unassignedHost: this.unassigned_hosts[this.placer_to_export.length].hostName,
                    });
                }
            }
        } else {
            this.total_placer = placer_data.paging.totalEntities;
            this.paging_data = placer_data.paging;
            const mappedData = this.placer_mapToUIFormat(placer_data.paging.entities);
            this.placer_data = [...mappedData];
            this.filtered_placer_data = [...mappedData];
            this.initial_load_placer = false;
        }
    }

    private getUnassignedHosts() {
        this._placer
            .get_unassigned_host()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => (this.unassigned_hosts = data.paging.entities));
    }

    private readyForExport() {
        const filename = this.host_id != '' ? this.host_name + '_placer_data' : 'Placer_Data';
        if (this.filter.assignee != 2) {
            this.placer_table_column = this.placer_table_column.filter(function (column) {
                return column.key != 'unassignedHost';
            });
        } else this.placer_table_column = this.placer_table_column.filter((column) => column.unassigned != false);

        let tables_to_export = this.placer_table_column;
        tables_to_export = tables_to_export.filter(function (column) {
            return !column.no_export;
        });
        this.worksheet = [
            {
                name: filename,
                columns: tables_to_export,
                data: this.placer_to_export,
            },
        ];
        this._export.generate(filename, this.worksheet);
        this.workbook_generation = false;
        this.placer_table_column = this.original_placer_table_column;
    }

    placer_mapToUIFormat(data: API_PLACER[]) {
        let count = this.paging_data.pageStart;
        return data.map((placer) => {
            const table = new UI_PLACER_DATA(
                { value: count++, link: null, editable: false, hidden: false },
                { value: placer.placerId, link: null, editable: false, key: false },
                {
                    value: placer.placerName,
                    link: null,
                    editable: true,
                    key: false,
                    label: 'Placer Name',
                    additional_params: {
                        placer: placer.placerId,
                        hostId: placer.hostId ? placer.hostId : null,
                    },
                },
                {
                    value: placer.hostName,
                    link: placer.hostId ? `/administrator/hosts/${placer.hostId}` : null,
                    editable: true,
                    dropdown_edit: true,
                    key: false,
                    new_tab_link: true,
                    label: 'Hosts',
                    hidden: false,
                    additional_params: {
                        placer: placer.placerId,
                        hostId: placer.hostId ? placer.hostId : null,
                        hostName: placer.hostName ? placer.hostName : '',
                        placername: placer.placerName ? placer.placerName : '',
                    },
                },
                {
                    value: `${placer.address}, ${placer.hostCity}` + `\n` + `${placer.hostState} ${placer.postalCode}`,
                    link: null,
                    editable: false,
                    key: false,
                },
                { value: placer.footTraffic, link: null, editable: false, key: false },
                { value: placer.averageDwellTime, link: null, editable: false, key: false },
                { value: placer.month, link: null, editable: false, key: false },
                {
                    value: this._date.transform(placer.dateUploaded, 'MMM d, y'),
                    link: null,
                    editable: false,
                    key: false,
                },
                { value: placer.uploadedBy, link: null, editable: false, key: false, compressed: true },
                {
                    value: this._date.transform(placer.publicationDate, 'MMM d, y'),
                    link: null,
                    editable: false,
                    key: false,
                },
                {
                    value: placer.sourceFile,
                    new_tab_link: false,
                    link: null,
                    editable: false,
                    hidden: false,
                    compressed: true,
                },
                {
                    value: placer.placerDumpId,
                    link: null,
                    editable: false,
                    key: false,
                    hidden: true,
                    no_show: true,
                },
            );
            return table;
        });
    }

    getColumnsAndOrder(event) {
        this.sort_column = event.column;
        this.sort_order = event.order;
        this.checkForApiToCall();
    }

    filterData(keyword) {
        this.search_keyword = keyword ? keyword : '';
        this.checkForApiToCall();
    }

    exportTable() {
        this.workbook_generation = true;
        this.getDataForExport();
    }

    private getDataForExport(): void {
        this.checkForApiToCall(1, true);
    }

    filterTable(value, label, is_date_from?, is_date_to?) {
        this.placer_table_column = this.original_placer_table_column;
        if (is_date_from) {
            this.filter.date_from = value;
            this.filter.date_from_label = label;
        } else if (is_date_to) {
            this.filter.date_to = value;
            this.filter.date_to_label = label;
        } else {
            if (value == 2) this.getUnassignedHosts();
            this.filter.assignee = value;
            this.filter.assignee_label = label;
        }

        if (this.filter.date_to_label || this.filter.assignee_label != '') this.checkForApiToCall();
    }

    private modifyDataForExport(data) {
        data.map((placer, index) => {
            placer.dateUploaded = this._date.transform(placer.dateUploaded, 'MMM d, y');
            placer.publicationDate = this._date.transform(placer.publicationDate, 'MMM d, y');

            //to map unassigned host column view on export
            if (this.unassigned_hosts.length) placer.unassignedHost = this.unassigned_hosts[index].hostName;
        });
    }

    reloadPage(e: boolean): void {
        if (e) this.ngOnInit();
    }

    clearFilter() {
        this.filter = {
            assignee: '0',
            assignee_label: '',
            date_to: '',
            date_to_label: '',
            date_from: '',
            date_from_label: '',
        };
        this.pickerDateFrom = '';
        this.pickerDateTo = '';
        this.placer_table_column = this.original_placer_table_column;
        this.checkForApiToCall();
    }

    uploadPlacer() {
        const client = filestack.init(environment.third_party.filestack_api_key);
        client.picker(this.filestackOptions).open();
    }

    protected get filestackOptions(): filestack.PickerOptions {
        let folder = 'dev';
        if (environment.production) folder = 'prod';
        else if (environment.base_uri.includes('stg')) folder = 'staging';
        else folder = 'dev';

        return {
            storeTo: {
                location: 's3',
                container: 'n-compass-filestack/csv/' + folder,
                region: 'us-east-2',
            },
            accept: ['.csv'],
            maxFiles: 1,
            onUploadDone: (response) => {
                let filename = response.filesUploaded[0].key;
                let new_filename = filename.split('csv/' + folder + '/');
                this._placer
                    .upload_placer(new_filename[1])
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        () => this.ngOnInit(),
                        (error) => {
                            console.error(error);
                        },
                    );
            },
        };
    }

    closeDatePickerFrom(event) {
        this.pickerDateFrom = event;
        this.filterTable(moment(event).format('MMMM YYYY'), moment(event).format('MMMM YYYY'), true, false);
        this.datePickerFrom.close();
    }

    closeDatePickerTo(event) {
        this.pickerDateTo = event;
        this.filterTable(moment(event).format('MMMM YYYY'), moment(event).format('MMMM YYYY'), false, true);
        this.datePickerTo.close();
    }
}
