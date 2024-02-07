import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { API_TEMPLATE } from 'src/app/global/models';

import { AuthService, TemplateService } from 'src/app/global/services';

@Component({
    selector: 'app-templates',
    templateUrl: './templates.component.html',
    styleUrls: ['./templates.component.scss'],
})
export class TemplatesComponent implements OnInit {
    title: string = 'Templates';
    templateData$ = this._template.get_templates();

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        public router: Router,
        private _auth: AuthService,
        private _template: TemplateService,
    ) {}

    ngOnInit() {}

    onClickTemplateLink(data: API_TEMPLATE) {
        this.router.navigate([`/${this.roleRoute}/templates/${data.template.templateId}`], {
            state: { data },
        });
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
