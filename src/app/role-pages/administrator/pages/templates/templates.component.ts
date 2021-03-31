import { Component, OnInit } from '@angular/core';
import { TemplateService } from '../../../../global/services/template-service/template.service';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-templates',
	templateUrl: './templates.component.html',
	styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit {

	title: string = "Templates";
	templates$: Observable<any>;
	
	constructor(
		private _template: TemplateService
	) { }

	ngOnInit() {
		this.templates$ = this._template.get_templates();
	}
}
