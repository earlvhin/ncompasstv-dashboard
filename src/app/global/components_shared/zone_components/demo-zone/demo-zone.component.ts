import { Component, OnInit, Input } from '@angular/core';
import { UI_CONTENT } from 'src/app/global/models/ui_content.model';

@Component({
    selector: 'app-demo-zone',
    templateUrl: './demo-zone.component.html',
    styleUrls: ['./demo-zone.component.scss'],
})
export class DemoZoneComponent implements OnInit {
    // External
    @Input() zone_name: string;
    @Input() zone_background: string;
    @Input() zone_width: string;
    @Input() zone_height: string;
    @Input() zone_pos_x: string;
    @Input() zone_pos_y: string;
    @Input() zone_playlist_id: string;
    @Input() zone_playlist_type: string;
    @Input() zone_playlist_content: UI_CONTENT[] = [];
    @Input() zone_order: number;
    is_fullscreen: boolean = false;

    constructor() {}

    ngOnInit() {}

    setToFullscreen(e) {
        setTimeout(() => {
            this.is_fullscreen = e;
        }, 0);
    }
}
