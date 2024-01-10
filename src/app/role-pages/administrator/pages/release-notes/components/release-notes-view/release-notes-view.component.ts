import { Component, OnInit, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ReleaseNotesService } from 'src/app/global/services';
import * as moment from 'moment';

import { UI_ROLE_DEFINITION } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Component({
  selector: 'app-release-notes-view',
  templateUrl: './release-notes-view.component.html',
  styleUrls: ['./release-notes-view.component.scss']
})
export class ReleaseNotesViewComponent implements OnInit {
    @ViewChildren('dataContainer') dataContainers: QueryList<ElementRef>;
    is_dealer_admin: boolean = false;
    recent_releases: Array<any> = [];

    constructor(
        private _release: ReleaseNotesService,
        private _auth: AuthService,
    ) { }

    ngOnInit() {
        this.getInstallationStats();
    }

    getInstallationStats() {
        this._release.getAllNotes().subscribe(
            (data:any) => {
                this.setReleaseNotes(data)
            }
        )
    }

    setReleaseNotes(data) {
        for (let i = 0; i < 3; i++) {
            this.recent_releases.push(data[i]);
            this.recent_releases[i].dateCreated = moment(this.recent_releases[i].dateCreated).format('MMM DD, YYYY');
        }
        setTimeout(()=>{
            this.dataContainers.forEach((div: ElementRef, index: number) => {
                div.nativeElement.innerHTML = this.recent_releases[index].description;
            });
        }, 500);
    }
}
