import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import * as moment from 'moment';
import { API_RELEASE_NOTE } from 'src/app/global/models';
import { ReleaseNotesService } from 'src/app/global/services';

@Component({
    selector: 'app-release-notes-view',
    templateUrl: './release-notes-view.component.html',
    styleUrls: ['./release-notes-view.component.scss'],
})
export class ReleaseNotesViewComponent implements OnInit {
    @ViewChildren('dataContainer') dataContainers: QueryList<ElementRef>;
    is_dealer_admin: boolean = false;
    recent_releases: API_RELEASE_NOTE[] = [];

    constructor(private _release: ReleaseNotesService) {}

    ngOnInit() {
        this.getAllNotes();
    }

    getAllNotes() {
        this._release.getAllNotes().subscribe((data: API_RELEASE_NOTE[]) => {
            this.recent_releases = data.slice(0, 3).map((releaseNote: API_RELEASE_NOTE) => ({
                ...releaseNote,
                dateCreated: moment(releaseNote.dateCreated).format('MMM DD, YYYY'),
            }));

            setTimeout(() => {
                this.dataContainers.forEach((div: ElementRef, index: number) => {
                    div.nativeElement.innerHTML = this.recent_releases[index].description;
                });
            }, 500);
        });
    }
}
