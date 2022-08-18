import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseService } from '../base.service';
import { API_RELEASE_NOTE } from 'src/app/global/models';

@Injectable({
  providedIn: 'root'
})
export class ReleaseNotesService extends BaseService {

	onEditNoteFromDataTable = new EventEmitter<{ releaseNoteId: string }>();
	onDeleteNoteFromDataTable = new EventEmitter<{ releaseNoteId: string }>();

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
