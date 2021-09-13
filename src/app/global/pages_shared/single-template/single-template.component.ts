import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_TEMPLATE } from 'src/app/global/models';
import { TemplateService } from 'src/app/global/services';

@Component({
	selector: 'app-single-template',
	templateUrl: './single-template.component.html',
	styleUrls: ['./single-template.component.scss']
})
export class SingleTemplateComponent implements OnInit, OnDestroy {

	data: API_TEMPLATE;
	
	private templateId: string;
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _route: ActivatedRoute,
		private _template: TemplateService,
	) { }
	
	ngOnInit() {
		this.templateId = this._route.snapshot.url[0].path;
		this.setPageData();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private getTemplateData(id: string) {
		return this._template.get_template_by_id(id)
			.pipe(takeUntil(this._unsubscribe), map(response => response[0]))
			.subscribe(
				response => this.data = response,
				error => console.log('Error retrieving template data', error)
			);
	}

	private setPageData() {

		if (!history.state.data) {
            this.getTemplateData(this.templateId);
            return;
        }

        this.data = history.state.data;

	}
	
}
