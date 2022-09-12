import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-wysiwyg',
	templateUrl: './wysiwyg.component.html',
	styleUrls: ['./wysiwyg.component.scss']
})
export class WysiwygComponent implements OnInit {
	tinymce_content: any = '';

	constructor() {}

	ngOnInit() {}

	saveEditorContent() {
		console.log(this.tinymce_content);
	}
}
