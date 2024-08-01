import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, map, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';

import { API_TEMPLATE, API_ZONE } from 'src/app/global/models';
import { FormService, TemplateService } from 'src/app/global/services';

@Component({
    selector: 'app-single-template',
    templateUrl: './single-template.component.html',
    styleUrls: ['./single-template.component.scss'],
    providers: [FormService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleTemplateComponent implements OnInit, OnDestroy {
    allFormsValid = this._form.allValid();
    hasMainZoneSet = false;
    isLoading = true;
    data: API_TEMPLATE;
    templateNameCtrl = new FormControl('', Validators.required);

    private templateId: string;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _changeDetector: ChangeDetectorRef,
        private _form: FormService,
        private _route: ActivatedRoute,
        private _template: TemplateService,
    ) {}

    ngOnInit() {
        this.templateId = this._route.snapshot.url[0].path;
        this.setPageData();
        this.subscribeToFormChanges();
        this._changeDetector.markForCheck();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public onSubmit(): void {
        const template = {
            name: this.templateNameCtrl.value,
            templateId: this.data.template.templateId,
        };

        const templateZones = this._form.formValue();
        this.isLoading = true;

        this._template
            .update_template(template, templateZones)
            .pipe(
                takeUntil(this.ngUnsubscribe),
                finalize(() => {
                    this.isLoading = false;
                    this._form.formArray.clear();
                    this._form.onClearFormArray.emit();
                    this._changeDetector.markForCheck();
                }),
            )
            .subscribe(
                () => this.getTemplateData(this.templateId),
                (e) => console.error(e),
            );
    }

    public setMainZone(toggledZone: { templateZoneId: string; isMainZone: boolean }): void {
        this._form.formArray.controls.forEach((control) => {
            const templateZoneId = (control.value as API_ZONE).templateZoneId;

            if (templateZoneId !== toggledZone.templateZoneId) {
                control.get('isMainZone').patchValue(false, { emitEvent: false });
            }
        });
    }

    private subscribeToFormChanges(): void {
        this._form.formArray.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
            const zones = this._form.formArray.value as API_ZONE[];
            this.hasMainZoneCheck(zones);
        });
    }

    private hasMainZoneCheck(data: API_ZONE[]): void {
        this.hasMainZoneSet = data.some((z) => z.isMainZone);
        this._changeDetector.markForCheck();
    }

    private getTemplateData(id: string): Subscription {
        return this._template
            .get_template_by_id(id)
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map((response) => response[0]),
            )
            .subscribe(
                (res) => (this.data = res),
                (e) => {
                    console.error(e);
                },
            );
    }

    private setPageData(): void {
        if (!history.state.data) {
            this.getTemplateData(this.templateId).add(() => {
                this.setTemplateName();
                this.isLoading = false;
                this._changeDetector.markForCheck();
            });

            return;
        }

        this.data = history.state.data;
        this.setTemplateName();
        this.isLoading = false;
        this._changeDetector.markForCheck();
    }

    private setTemplateName(): void {
        this.templateNameCtrl.setValue(this.data.template.name);
    }
}
