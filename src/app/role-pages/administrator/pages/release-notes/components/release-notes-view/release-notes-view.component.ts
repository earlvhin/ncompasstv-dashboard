import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
    @ViewChild('dataContainer', { static: false }) dataContainer: ElementRef;
    latest_release: any;
    is_dealer_admin: boolean = false;

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
        this.latest_release = data[0];
        this.latest_release.dateCreated = moment(this.latest_release.dateCreated).format('MMM DD, YYYY');
        setTimeout(()=>{                           
            this.dataContainer.nativeElement.innerHTML = this.latest_release.description;
        }, 500);
    }
}
