import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/global/services';

@Component({
    selector: 'app-delete-filler-feeds',
    templateUrl: './delete-filler-feeds.component.html',
    styleUrls: ['./delete-filler-feeds.component.scss'],
})
export class DeleteFillerFeedsComponent implements OnInit {
    filler_feeds = this.page_data.filler_feeds;

    constructor(
        @Inject(MAT_DIALOG_DATA) public page_data: { filler_feeds: any },
        private _router: Router,
        private _auth: AuthService,
    ) {}

    ngOnInit() {}

    openPlaylist(id) {
        const url = this._router.serializeUrl(
            this._router.createUrlTree([`/${this.roleRoute}/playlists/${id}`], {}),
        );
        window.open(url, '_blank');
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
