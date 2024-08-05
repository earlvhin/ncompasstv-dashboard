import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs-compat';
import { Subject } from 'rxjs';
import { DATA_TABLE, DATA_TABLE_ROW, DeleteProgrammaticVendor, ProgrammaticVendor } from 'src/app/global/models';
import { ProgrammaticService } from 'src/app/global/services';
import { AddEditProgrammaticModalComponent } from '../add-edit-programmatic-modal/add-edit-programmatic-modal.component';

@Component({
    selector: 'app-programmatic-vendors',
    templateUrl: './programmatic-vendor.component.html',
    styleUrls: ['./programmatic-vendor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgrammaticVendorComponent implements OnInit, OnChanges, OnDestroy {
    @Input() vendors_list: ProgrammaticVendor[] = [];
    @Output() on_refresh_vendors: EventEmitter<void> = new EventEmitter();

    vendorsMappedToTable: DATA_TABLE;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _programmatic: ProgrammaticService,
    ) {}

    ngOnInit(): void {
        this.vendorsMappedToTable = this.getInitialTableData(this.vendors_list);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['vendors_list']) {
            this.updateVendorList();
        }
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public onAddVendor(): void {
        const config: MatDialogConfig = {
            height: 'auto',
            width: '992px',
            disableClose: true,
        };

        this._dialog
            .open(AddEditProgrammaticModalComponent, config)
            .afterClosed()
            .subscribe({
                next: () => {
                    this.on_refresh_vendors.emit();
                },
            });
    }

    public onEditVendor(id: string): void {
        let vendor = this.vendors_list.find(function (obj) {
            return obj.id === id;
        });

        const config: MatDialogConfig = {
            height: 'auto',
            width: '992px',
            disableClose: true,
            data: vendor,
        };

        this._dialog
            .open(AddEditProgrammaticModalComponent, config)
            .afterClosed()
            .subscribe({
                next: () => {
                    this.on_refresh_vendors.emit();
                },
            });
    }

    public onDeleteVendor(id: string): void {
        // remove the vendor from the current list
        this.removeVendorFromCurrentList(id);

        // send a delete request to the server and update the vendor list
        this.deleteVendor(id).subscribe({
            next: (res) => {
                if (res.data > 0) {
                    this.on_refresh_vendors.emit();
                }
            },
            error: (e) => {
                console.error(e);
            },
        });
    }

    private deleteVendor(id: string): Observable<DeleteProgrammaticVendor> {
        return this._programmatic.deleteVendor(id).pipe(takeUntil(this.ngUnsubscribe));
    }

    private mapToTableData(data: ProgrammaticVendor[]): DATA_TABLE_ROW[][] {
        const DATE_FORMAT = 'MMM dd, yyyy, hh:mm a';

        const sortByDateDesc = data.sort(
            (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
        );

        return sortByDateDesc.map((x) => {
            return [
                {
                    value: x.id,
                    uniqueIdentifier: x.id,
                    isHidden: true,
                },
                {
                    value: x.name,
                    isHidden: false,
                    isLink: false,
                    insideLink: x.id,
                    newTab: true,
                },
                {
                    value: x.description,
                    isHidden: false,
                },
                {
                    value: x.apiUrl,
                    isLink: true,
                    externalLink: x.apiUrl,
                    newTab: true,
                    isHidden: false,
                },
                {
                    value: x.status,
                    isHidden: false,
                },
                {
                    value: this._date.transform(x.dateCreated, DATE_FORMAT),
                    isHidden: false,
                },
            ];
        });
    }

    private removeVendorFromCurrentList(id: string): void {
        const toDelete = this.vendors_list.findIndex((x) => x.id === id);
        this.vendors_list.splice(toDelete, 1);
        this.updateVendorList();
    }

    private updateVendorList(): void {
        if (typeof this.vendorsMappedToTable === 'undefined') return;
        this.vendorsMappedToTable.data = this.mapToTableData(this.vendors_list);
    }

    protected getInitialTableData(data: ProgrammaticVendor[]): DATA_TABLE {
        return {
            label: this.tableColumns,
            data: this.mapToTableData(data),
            hasActions: {
                value: true,
                actions: this.tableActions,
            },
        };
    }

    protected get tableColumns(): string[] {
        return ['#', 'Name', 'Description', 'URL', 'Status', 'Date Created'];
    }

    protected get tableActions(): { label: string; icon: string; action: string; title: string }[] {
        return [
            {
                label: 'Edit',
                icon: 'fas fa-edit',
                action: 'edit_app',
                title: 'Edit',
            },
            {
                label: 'Delete',
                icon: 'fas fa-trash',
                action: 'delete_app',
                title: 'Delete App',
            },
        ];
    }
}
