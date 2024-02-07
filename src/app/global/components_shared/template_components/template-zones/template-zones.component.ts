import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TemplateService } from 'src/app/global/services/template-service/template.service';

@Component({
    selector: 'app-template-zones',
    templateUrl: './template-zones.component.html',
    styleUrls: ['./template-zones.component.scss'],
})
export class TemplateZonesComponent implements OnInit, OnDestroy {
    // External
    @Input() zone_name: string;
    @Input() zone_background: string;
    @Input() zone_width: number;
    @Input() zone_height: number;
    @Input() zone_pos_x: number;
    @Input() zone_pos_y: number;
    @Input() zone_order: number;
    @Input() zone_playlist_id: string;
    @Input() clickable_zone: boolean;
    @Input() is_focus: boolean;
    @Input() is_interactive: boolean;
    @Input() is_text_displayed: boolean;

    zone_selected: string;
    private subscriptions: Subscription = new Subscription();

    constructor(private _template: TemplateService) {}

    ngOnInit() {
        if (this.is_interactive) this.subscribeToZoneSelect();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    zoneSelect(name: string): void {
        if (this.is_interactive) {
            this._template.onSelectZone.emit(name);
        }
    }

    private subscribeToZoneSelect(): void {
        this.subscriptions.add(
            this._template.onSelectZone.subscribe(
                (name: string) => (this.zone_selected = name),
                (error) => {
                    console.error(error);
                },
            ),
        );
    }
}
