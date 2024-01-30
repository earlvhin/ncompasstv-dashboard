import * as moment from 'moment';
import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { API_RELEASE_NOTE } from 'src/app/global/models';
import { AuthService, ReleaseNotesService } from 'src/app/global/services';
import { CreateUpdateDialogComponent } from '../create-update-dialog/create-update-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-release-notes-view',
    templateUrl: './release-notes-view.component.html',
    styleUrls: ['./release-notes-view.component.scss'],
})
export class ReleaseNotesViewComponent implements OnInit {
    @ViewChildren('dataContainer') dataContainers: QueryList<ElementRef>;
    is_current_user_admin = this._auth.current_role === 'administrator';
    is_dealer_admin: boolean = false;
    release_expanded_panel_index = 0;
    release_notes: API_RELEASE_NOTE[] = [];
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _release: ReleaseNotesService,
        ) {}

    ngOnInit() {
        this.getAllNotes();
    }

    getAllNotes() {
        this._release.getAllNotes().subscribe((data: API_RELEASE_NOTE[]) => {
            if (!this.is_current_user_admin) data = data.slice(0, 5);

            this.release_notes = data.map((releaseNote: API_RELEASE_NOTE) => ({
                ...releaseNote,
                dateCreated: moment(releaseNote.dateCreated).format('MMM DD, YYYY'),
            }));

            setTimeout(() => {
                this.dataContainers.forEach((div: ElementRef, index: number) => {
                    div.nativeElement.innerHTML = this.release_notes[index].description;
                });
            }, 500);
        });
    }

    onAdd(): void {
        const config = { width: '1000px', height: '750px', disableClose: true };
        this._dialog.open(CreateUpdateDialogComponent, config)
        .afterClosed().subscribe((response: boolean | API_RELEASE_NOTE) => {

            if (!response) return;
            const data = response as API_RELEASE_NOTE;
            const all_releases = [...this.release_notes];
            data.dateCreated = moment(data.dateCreated).format('MMM DD, YYYY');
            all_releases.unshift(data);
            this.setDataForDisplay(all_releases);
            this.release_expanded_panel_index = 0;
        });
    }

    onEdit(e: Event, release_note_id: string): void {
        e.stopPropagation();
        const config = { width: '1000px', height: '750px', disableClose: true };
        const dialog = this._dialog.open(CreateUpdateDialogComponent, config);
        dialog.componentInstance.dialogMode = 'update';
        dialog.componentInstance.note = this.release_notes.filter(note => note.releaseNoteId === release_note_id)[0];

        dialog.afterClosed().subscribe((response: boolean | API_RELEASE_NOTE) => {

            if (!response) return;
            const data = response as API_RELEASE_NOTE;
            const all_releases = [...this.release_notes];
            const indexToReplace = all_releases.findIndex(note => note.releaseNoteId === release_note_id);
            data.dateCreated = moment(data.dateCreated).format('MMM DD, YYYY');
            all_releases[indexToReplace] = data;
            this.setDataForDisplay(all_releases);
            this.release_expanded_panel_index = indexToReplace;
        });
    }

    onDelete(e:Event, release_note_id: string): void {
        e.stopPropagation();
        this.warningModal(
            'warning',
            'Delete Release Note',
            'Are you sure you want to delete this note?',
            '',
            'delete-release-note',
            release_note_id
        );
    }

    warningModal(status: string, message: string, data: string, return_msg: string, action: string, id: any): void {
        this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data, return_msg, action }
        }).afterClosed().subscribe((result) => {
            if (result === 'delete-release-note') {
                this._release.deleteNote(id).pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        () => {
                            const all_releases = this.release_notes;
                            const indexToDelete = all_releases.findIndex(note => note.releaseNoteId === id);
                            all_releases.splice(indexToDelete, 1);
                            this.setDataForDisplay(all_releases);
                        }
                    );
            }
        });
    }

    private setDataForDisplay(data: API_RELEASE_NOTE[]): void {

        if (!data || data.length <= 0) {
            this.release_notes = [];
            return;
        }

        this.release_notes = [...data];

        setTimeout(() => {
            this.dataContainers.forEach((div: ElementRef, index: number) => {
                div.nativeElement.innerHTML = data[index].description;
            });
        }, 500);
    }
}
