import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

import { HostService } from 'src/app/global/services';
import { API_DMA, UI_HOST_DMA } from 'src/app/global/models';

@Component({
    selector: 'app-dma-view',
    templateUrl: './dma-view.component.html',
    styleUrls: ['./dma-view.component.scss'],
})
export class DmaViewComponent implements OnInit, OnDestroy {
    dma_data: any[] = [];
    dma_to_export: any[] = [];
    filtered_data_dma: any[] = [];
    initial_load_dma: boolean = true;
    paging_data: any;
    search_key: string = '';
    searching_dma: boolean = false;
    workbook: any;
    workbook_generation: boolean = false;
    worksheet: any;

    protected _unsubscribe = new Subject<void>();

    dma_table_column = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Rank', key: 'dmaRank' },
        { name: 'Number of Hosts', key: 'totalHosts' },
        { name: 'DMA Code', key: 'dmaCode' },
        { name: 'DMA Name', key: 'dmaName' },
        // { name: 'County', key: 'county', no_show: true, hidden: true },
    ];

    constructor(private _host: HostService) {}

    ngOnInit() {
        this.getDMA(1);
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    filterData(e) {
        this.search_key = e;
        this.getDMA(1);
    }

    getDMA(page, pageSize?): void {
        this.searching_dma = true;
        this._host
            .get_all_dma(page, this.search_key, pageSize)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (data.paging.entities.length > 0) {
                    this.paging_data = data.paging;
                    const mappedData = this.dma_mapToUIFormat(data.paging.entities);
                    this.dma_data = [...mappedData];
                    this.filtered_data_dma = [...mappedData];

                    this.initial_load_dma = false;
                } else {
                    this.dma_data = [];
                    this.filtered_data_dma = [];
                    this.paging_data = [];
                }
                this.searching_dma = false;
            });
    }

    dma_mapToUIFormat(data: any[]) {
        let count = this.paging_data.pageStart;
        return data.map((h) => {
            const table = new UI_HOST_DMA(
                { value: count++, link: null, editable: false, hidden: false },
                { value: h.dmaRank, link: null, editable: false, key: false },
                {
                    value: h.totalHosts,
                    link: null,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    label: 'Hosts',
                    popview: true,
                    data_to_fetch: { rank: h.dmaRank, code: h.dmaCode, name: h.dmaName },
                },
                {
                    value: h.dmaCode,
                    link: null,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.dmaName,
                    link: null,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
            );
            return table;
        });
    }

    exportTable() {
        this.workbook_generation = true;
        const header = [];
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.useStyles = true;
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet('DMA View');
        Object.keys(this.dma_table_column).forEach((key) => {
            if (this.dma_table_column[key].name && !this.dma_table_column[key].no_export) {
                header.push({
                    header: this.dma_table_column[key].name,
                    key: this.dma_table_column[key].key,
                    width: 30,
                    style: { font: { name: 'Arial', bold: true } },
                });
            }
        });

        this.worksheet.columns = header;
        this.getDataForExport();
    }

    getDataForExport() {
        const EXCEL_TYPE =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

        this._host
            .get_all_dma(1, this.search_key, 0)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                const dma = response.paging.entities as API_DMA[];

                if (dma.length <= 0) {
                    this.dma_to_export = [];
                    return;
                } else {
                    this.dma_to_export = [...response.paging.entities];
                }

                this.dma_to_export.forEach((item) => {
                    this.worksheet.addRow(item).font = { bold: false };
                });

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
                    const filename = 'DMA' + '.xlsx';
                    saveAs(blob, filename);
                });

                this.workbook_generation = false;
            });
    }
}
