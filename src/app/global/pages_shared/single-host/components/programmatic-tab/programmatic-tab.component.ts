import { Component, Input, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatSlideToggleChange, MatSnackBar } from '@angular/material';
import { ConfirmationDialogService, HostService, ProgrammaticService } from 'src/app/global/services';
import { VendorsIdAndNames } from 'src/app/global/models';

@Component({
    selector: 'app-host-programmatic-tab',
    templateUrl: './programmatic-tab.component.html',
    styleUrls: ['./programmatic-tab.component.scss'],
})
export class ProgrammaticTabComponent implements OnInit {
    @Input() hostId: string;

    allProgrammaticVendors: VendorsIdAndNames[];
    hostDisabledVendorsIds: string[] = [];
    hasNoData = false;

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _confirmDialog: ConfirmationDialogService,
        private _host: HostService,
        private _programmatic: ProgrammaticService,
        private _snackbar: MatSnackBar,
    ) {}

    ngOnInit() {
        this.getAllVendors();
        this.getDisabledVendorIds();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    private getAllVendors(): void {
        this._programmatic
            .getAllVendorsIdAndNames()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (!response.data.length) {
                        this.hasNoData = true;
                        return;
                    }
                    this.allProgrammaticVendors = response.data;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getDisabledVendorIds(): void {
        this._host
            .getDisabledProgramamtics(this.hostId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (!response.data.length) return;
                    this.hostDisabledVendorsIds = response.data;
                },
                (e) => {
                    console.error('Failed to retrieve disabled vendor IDs', e);
                },
            );
    }

    public isVendorEnabled(vendorId: string): boolean {
        if (this.hostDisabledVendorsIds && this.hostDisabledVendorsIds.includes(vendorId)) return false;

        return true;
    }

    public showSuccessSnackBar(): void {
        this._snackbar.open(`Changes saved!`, '', {
            duration: 3000,
        });
    }

    /**
     * Callback function when toggling the programmatic vendor
     *
     * @param {MatSlideToggleChange} event
     * @param {string} vendorId
     * @returns {Promise<void>}
     */
    public async onToggleHostProgrammatic(event: MatSlideToggleChange, vendorId: string): Promise<void> {
        const checked = event.checked;
        const warningMessagePrefix = checked ? 'Enable' : 'Disable';
        const payload = { programmaticId: vendorId, hostId: this.hostId };
        const dialogConfig = { message: `${warningMessagePrefix} vendor on this host?`, data: '' };
        const confirmAction = await this._confirmDialog.warning(dialogConfig).toPromise();

        if (!confirmAction) {
            event.source.checked = !event.checked;
            return;
        }

        // if checked/toggled ON, then enable the vendor
        // else disable vendor
        if (checked) {
            this._host
                .enableProgrammaticVendor(payload)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (response) => {
                        if (!response.data) return;

                        const vendorIdIndex = this.hostDisabledVendorsIds.indexOf(vendorId);
                        if (vendorIdIndex > -1) this.hostDisabledVendorsIds.splice(vendorIdIndex, 1);
                        this.showSuccessSnackBar();
                    },
                    (e) => {
                        console.error('Failed to enable programmatic vendor', e);
                        this._confirmDialog.error();
                        event.source.checked = !event.checked;
                    },
                );

            return;
        }

        this._host
            .disableProgrammaticVendor(payload)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (response.data) this.hostDisabledVendorsIds.push(vendorId);
                    this.showSuccessSnackBar();
                },
                (e) => {
                    console.error('Failed to disable programmatic vendor', e);
                    this._confirmDialog.error();
                    event.source.checked = event.checked;
                },
            );
    }
}
