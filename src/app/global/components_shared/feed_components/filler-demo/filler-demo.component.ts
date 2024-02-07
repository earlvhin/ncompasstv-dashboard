import { Component, Input, OnInit } from '@angular/core';
import { GenerateFillerFeed } from 'src/app/global/models/api_feed_generator.model';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-filler-demo',
    templateUrl: './filler-demo.component.html',
    styleUrls: ['./filler-demo.component.scss'],
})
export class FillerDemoComponent implements OnInit {
    @Input() filler_data: GenerateFillerFeed;
    iframeUrl: string;

    constructor() {}

    ngOnInit() {
        this.iframeUrl = `${environment.base_uri}${environment.create.api_new_filler_feed_demo}
		?contentIds=${this.filler_data.feedFillers
            .map((i) => {
                return i.contentId;
            })
            .toString()}`;
    }
}
