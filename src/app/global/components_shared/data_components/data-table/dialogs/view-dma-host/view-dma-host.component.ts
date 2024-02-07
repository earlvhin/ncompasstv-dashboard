import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { HostService } from 'src/app/global/services';

@Component({
    selector: 'app-view-dma-host',
    templateUrl: './view-dma-host.component.html',
    styleUrls: ['./view-dma-host.component.scss'],
})
export class ViewDmaHostComponent implements OnInit, OnDestroy {
    protected _unsubscribe = new Subject<void>();
    hosts_of_dma: any = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
        private _host: HostService,
    ) {}

    ngOnInit() {
        this._host
            .get_host_via_dma(
                this._dialog_data.status.data_to_fetch.rank,
                this._dialog_data.status.data_to_fetch.code,
                this._dialog_data.status.data_to_fetch.name,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.hosts_of_dma = data.paging.entities;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    getLink(page: string, id: string) {
        return `/administrator/${page}/${id}`;
    }
}
