import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material'

@Component({
	selector: 'app-information-modal',
	templateUrl: './information-modal.component.html',
	styleUrls: ['./information-modal.component.scss']
})
export class InformationModalComponent implements OnInit {

	character_limit = 0;
	contents: any;
	title: string;
	type: string;
	graph: boolean = false;
	
	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: { type: string, title: string, contents: any, character_limit?: number, graph?:boolean },
	) { }
		
	ngOnInit() {
		const { contents, title, type, character_limit, graph } = this._dialog_data;
		this.contents = contents;
		this.title = title;
		this.type = type;
        this.graph = graph;
		if (character_limit) this.character_limit = character_limit;
        console.log(this.contents)
	}

	get isArrayContent(): boolean {
		return Array.isArray(this.contents);
	}

    get isGraph(): boolean {
		return this.graph;
	}

	get isBusinessHours(): boolean {
		return this.title === 'Business Hours';
	}

	get isList(): boolean {
		return this.type === 'list';
	}

	get isStringContent(): boolean {
		return typeof this.contents === 'string';
	}

	get isTextArea(): boolean {
		return this.type === 'textarea';
	}

	get isTextField(): boolean {
		return this.type === 'field';
	}

	displayContents(): string {
		if (typeof this.contents !== 'string' || !this.contents) return '';
		if (this.character_limit > 0) return this.contents.substr(0, this.character_limit);
		return this.contents;
	}

    getSum() {
        var sum = 0;
        this.contents.dealers.map(
            i=> {
                sum = sum + i.totalHosts;
            }
        )
        return sum;
    }

}