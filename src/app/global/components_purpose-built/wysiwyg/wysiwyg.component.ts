import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-wysiwyg',
    templateUrl: './wysiwyg.component.html',
    styleUrls: ['./wysiwyg.component.scss'],
})
export class WysiwygComponent implements OnInit {
    tinymce_content: any = '';
    @Output() tynimce_value: EventEmitter<any> = new EventEmitter();
    @Input() description;
    apiKey: string;
    editor_has_been_loaded: boolean = false;

    constructor() {}

    ngOnInit() {
        this.apiKey = environment.tinymce_key;
        if (this.description.length > 0) {
            this.tinymce_content = this.description;
            this.tynimce_value.emit(this.description);
        }
    }

    editorInit() {
        this.editor_has_been_loaded = true;
    }

    getValue($event) {
        this.tynimce_value.emit($event.editor.getContent());
    }
}
