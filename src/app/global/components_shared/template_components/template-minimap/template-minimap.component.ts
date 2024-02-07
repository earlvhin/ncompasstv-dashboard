import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-template-minimap',
    templateUrl: './template-minimap.component.html',
    styleUrls: ['./template-minimap.component.scss'],
})
export class TemplateMinimapComponent implements OnInit {
    @Input() larger: boolean;
    @Input() clickable: boolean;
    @Input() zone_focus: string;
    @Input() is_text_displayed: boolean;
    @Input() template_data: any;
    @Input() is_interactive = false;
    @Input() height?: string;
    @Input() width?: string;

    constructor() {}

    ngOnInit() {}
}
