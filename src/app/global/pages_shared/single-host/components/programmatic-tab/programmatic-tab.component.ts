import { Component, Input, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
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
                    if (response.data.length) {
                        this.hostDisabledVendorsIds = response.data;
                    }
                },
                (error) => {
                    console.error(error);
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

    public async onToggleHostProgrammatic(event: MatSlideToggleChange, vendorId: string): Promise<void> {
        let payload = {
            programmaticId: vendorId,
            hostId: this.hostId,
        };
        let checked = event.checked;
        let warningMessagePrefix = checked ? 'Enable' : 'Disable';

        const confirmAction = await this._confirmDialog
            .warning({
                message: warningMessagePrefix + ' vendor on this host?',
                data: '',
            })
            .toPromise();

        if (!confirmAction) {
            event.source.checked = !event.checked;
            return;
        }

        // Enable Vendor on Host
        if (checked) {
            this._host
                .enableProgrammaticVendor(payload)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (response) => {
                        if (response.data) {
                            let vendorIdIndex = this.hostDisabledVendorsIds.indexOf(vendorId);

                            if (vendorIdIndex > -1) {
                                this.hostDisabledVendorsIds.splice(vendorIdIndex, 1);
                            }

                            this.showSuccessSnackBar();
                        }
                    },
                    (error) => {
                        this._confirmDialog.error();
                        event.source.checked = !event.checked;
                    },
                );
        } else {
            this._host
                .disableProgrammaticVendor(payload)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (response) => {
                        if (response.data) {
                            this.hostDisabledVendorsIds.push(vendorId);
                        }

                        this.showSuccessSnackBar();
                    },
                    (error) => {
                        this._confirmDialog.error();
                        event.source.checked = event.checked;
                    },
                );
        }
    }
}
