import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import { API_RELEASE_NOTE } from 'src/app/global/models';
import { BaseService } from '../base.service';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Injectable({
    providedIn: 'root',
})
export class ReleaseNotesService extends BaseService {
    onEditNoteFromDataTable = new Subject<{ releaseNoteId: string }>();
    onDeleteNoteFromDataTable = new Subject<{ releaseNoteId: string }>();
    token = JSON.parse(localStorage.getItem('tokens'));

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    createOrUpdateNote(data: API_RELEASE_NOTE): Observable<{ releaseNotes: API_RELEASE_NOTE }> {
        const url = this.upserts.release_notes;
        return this.postRequest(url, data);
    }

    deleteNote(releaseNoteId: string) {
        const url = `${this.deleters.release_note}?id=${releaseNoteId}`;
        return this.postRequest(url, {});
    }

    getAllNotes(): Observable<API_RELEASE_NOTE[]> {
        const url = this.getters.all_release_notes;
        return this.getRequest(url);
    }

    getNoteById(id: string) {
        const url = `${this.getters.release_note_by_id}?id=${id}`;
        return this.getRequest(url);
    }
}
