import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReleaseNotesService } from 'src/app/global/services';
import * as moment from 'moment';

@Component({
  selector: 'app-release-notes-view',
  templateUrl: './release-notes-view.component.html',
  styleUrls: ['./release-notes-view.component.scss']
})
export class ReleaseNotesViewComponent implements OnInit {
    @ViewChild('dataContainer', { static: false }) dataContainer: ElementRef;
    latest_release: any;

    constructor(
        private _release: ReleaseNotesService,
    ) { }

    ngOnInit() {
        this.getInstallationStats();
    }

    getInstallationStats() {
        this._release.getAllNotes().subscribe(
            (data:any) => {
                this.latest_release = data[data.length-1];
                this.latest_release.dateCreated = moment(this.latest_release.dateCreated).format('MMM DD, YYYY');
                setTimeout(()=>{                           // <<<---using ()=> syntax
                    this.dataContainer.nativeElement.innerHTML = this.latest_release.description;
                }, 500);
            }
        )
    }
}
