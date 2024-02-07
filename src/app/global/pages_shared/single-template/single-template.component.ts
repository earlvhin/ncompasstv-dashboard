import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_TEMPLATE } from 'src/app/global/models';
import { FormService, TemplateService } from 'src/app/global/services';
import { FormControl, Validators } from '@angular/forms';

@Component({
    selector: 'app-single-template',
    templateUrl: './single-template.component.html',
    styleUrls: ['./single-template.component.scss'],
    providers: [FormService],
})
export class SingleTemplateComponent implements OnInit, OnDestroy {
    allFormsValid = this._form.allValid();
    isLoading = true;
    data: API_TEMPLATE;
    templateNameCtrl = new FormControl('', Validators.required);

    private templateId: string;
    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _form: FormService,
        private _route: ActivatedRoute,
        private _template: TemplateService,
    ) {}

    ngOnInit() {
        this.templateId = this._route.snapshot.url[0].path;
        this.setPageData();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onSubmit(): void {
        const template = {
            name: this.templateNameCtrl.value,
            templateId: this.data.template.templateId,
        };
        const templateZones = this._form.formValue();
        this.isLoading = true;

        this._template
            .update_template(template, templateZones)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => this.getTemplateData(this.templateId).add(() => (this.isLoading = false)),
                (error) => {
                    console.error(error);
                },
            );
    }

    private getTemplateData(id: string) {
        return this._template
            .get_template_by_id(id)
            .pipe(
                takeUntil(this._unsubscribe),
                map((response) => response[0]),
            )
            .subscribe(
                (response) => (this.data = response),
                (error) => {
                    console.error(error);
                },
            );
    }

    private setPageData(): void {
        if (!history.state.data) {
            this.getTemplateData(this.templateId).add(() => {
                this.setTemplateName();
                this.isLoading = false;
            });

            return;
        }

        this.data = history.state.data;
        this.setTemplateName();
        this.isLoading = false;
    }

    private setTemplateName(): void {
        this.templateNameCtrl.setValue(this.data.template.name);
    }
}
