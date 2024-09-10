import * as moment from 'moment-timezone';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil, finalize } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { ToolsService } from 'src/app/global/services';
import { ProgrammaticService } from 'src/app/global/services';
import { GetProgrammaticVendors, GLOBAL_SETTINGS, ProgrammaticVendor } from 'src/app/global/models';

@Component({
    selector: 'app-tools',
    templateUrl: './programmatic.component.html',
    styleUrls: ['./programmatic.component.scss'],
})
export class ProgrammaticComponent implements OnInit {
    globalSettingsForm: FormGroup;
    vendorsLoaded = false;
    programmaticVendors: ProgrammaticVendor[] = [];
    globalSettings: GLOBAL_SETTINGS[];
    title = 'Programmatic Settings';
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _form: FormBuilder,
        private _tool: ToolsService,
        private _programmatic: ProgrammaticService,
    ) {}

    ngOnInit() {
        this.globalSettingsForm = this._form.group({
            vistarNetworkId: ['', Validators.required],
            vistarApiKey: ['', Validators.required],
        });

        this.getGlobalSettings();
        this.loadInitialVendorsList();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public refreshVendorsList(): void {
        this.getAllVendors().subscribe({
            next: (res) => (this.programmaticVendors = this.convertDateTimeCreatedToUserTimezone(res.data)),
            error: (e) => {
                console.error(e);
            },
        });
    }

    private getCurrentTimezone(): string {
        return moment.tz.guess();
    }

    private convertToTimezone(utcDate: string, timeZone: string): string {
        return moment.utc(utcDate).tz(timeZone).format('YYYY-MM-DD HH:mm:ss Z');
    }

    private convertDateTimeCreatedToUserTimezone(dates: ProgrammaticVendor[]): ProgrammaticVendor[] {
        return dates.map((vendor) => {
            const hasDateString = (data: ProgrammaticVendor) => {
                return (
                    typeof data.dateCreated !== 'undefined' && data.dateCreated && typeof data.dateCreated === 'string'
                );
            };

            if (hasDateString(vendor)) {
                const converted = this.convertToTimezone(vendor.dateCreated, this.getCurrentTimezone());
                vendor.dateCreated = converted;
            }

            return vendor;
        });
    }

    private loadInitialVendorsList(): void {
        this.vendorsLoaded = false;

        this.getAllVendors()
            .pipe(finalize(() => (this.vendorsLoaded = true)))
            .subscribe({
                next: (res) => (this.programmaticVendors = this.convertDateTimeCreatedToUserTimezone(res.data)),
                error: (e) => console.error(e),
            });
    }

    private getAllVendors(): Observable<GetProgrammaticVendors> {
        return this._programmatic.getAllVendors().pipe(takeUntil(this.ngUnsubscribe));
    }

    private getGlobalSettings(): void {
        this._tool
            .getGlobalSettings()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (res) => {
                    this.globalSettings = res.globalSettings;
                },
                error: (e) => {
                    console.error(e);
                },
            });
    }
}
