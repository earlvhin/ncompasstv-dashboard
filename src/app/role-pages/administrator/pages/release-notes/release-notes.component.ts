import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { API_RELEASE_NOTE, UI_RELEASE_NOTE } from 'src/app/global/models';
import { ReleaseNotesService } from 'src/app/global/services';
import { CreateUpdateDialogComponent } from './components/create-update-dialog/create-update-dialog.component';

@Component({
    selector: 'app-release-notes',
    templateUrl: './release-notes.component.html',
    styleUrls: ['./release-notes.component.scss'],
})
export class ReleaseNotesComponent implements OnInit, OnDestroy {
    isTableDataLoaded = false;
    notes: API_RELEASE_NOTE[] = [];
    title = 'Release Notes';
    notesTableColumns = this._notesTableColumns;
    notesTableData: UI_RELEASE_NOTE[];
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _release: ReleaseNotesService,
    ) {}

    ngOnInit() {
        this.getAllNotes()
            .subscribe((response) => {
                this.setDataForDisplay(response);
                this.isTableDataLoaded = true;
            })
            .add(() => {
                this.subscribeToDeleteNoteFromTable();
                this.subscribeToEditNoteFromTable();
            });
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onAdd(): void {
        const config = { width: '1200px', height: '500px', disableClose: true };
        const dialog = this._dialog.open(CreateUpdateDialogComponent, config);

        dialog.afterClosed().subscribe((response: boolean | API_RELEASE_NOTE) => {
            if (!response) return;
            const data = response as API_RELEASE_NOTE;
            const notes = [...this.notes];
            notes.unshift(data);
            this.setDataForDisplay(notes);
        });
    }

    private getAllNotes(): Observable<API_RELEASE_NOTE[]> {
        return this._release.getAllNotes().pipe(takeUntil(this._unsubscribe));
    }

    private mapNotesToTable(data: API_RELEASE_NOTE[]): UI_RELEASE_NOTE[] {
        return data.map((note, index) => {
            return {
                index: { value: index + 1, editable: false, hidden: false },
                version: { value: note.version, editable: false, hidden: false },
                title: { value: note.title, editable: false, hidden: false },
                dateCreated: {
                    value: this._date.transform(note.dateCreated, 'MMM dd, yyyy'),
                    editable: false,
                    hidden: false,
                },
                description: { value: note.description, editable: false, hidden: true },
                releaseNoteId: { value: note.releaseNoteId, editable: false, hidden: true },
            };
        });
    }

    private setDataForDisplay(data: API_RELEASE_NOTE[]): void {
        if (!data || data.length <= 0) {
            this.notes = [];
            this.notesTableData = [];
            return;
        }

        this.notes = [...data];
        this.notesTableData = [...this.mapNotesToTable(data)];
    }

    private subscribeToDeleteNoteFromTable(): void {
        this._release.onDeleteNoteFromDataTable
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(({ releaseNoteId }) => {
                this._release
                    .deleteNote(releaseNoteId)
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(() => {
                        const notes = this.notes;
                        const indexToDelete = notes.findIndex(
                            (note) => note.releaseNoteId === releaseNoteId,
                        );
                        notes.splice(indexToDelete, 1);
                        this.setDataForDisplay(notes);
                    });
            });
    }

    private subscribeToEditNoteFromTable(): void {
        this._release.onEditNoteFromDataTable
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(({ releaseNoteId }) => {
                const config = { width: '1200px', height: '500px', disableClose: true };
                const dialog = this._dialog.open(CreateUpdateDialogComponent, config);
                dialog.componentInstance.dialogMode = 'update';
                dialog.componentInstance.note = this.notes.filter(
                    (note) => note.releaseNoteId === releaseNoteId,
                )[0];

                dialog.afterClosed().subscribe((response: boolean | API_RELEASE_NOTE) => {
                    if (!response) return;
                    const data = response as API_RELEASE_NOTE;
                    const notes = this.notes;
                    const indexToUpdate = notes.findIndex(
                        (note) => note.releaseNoteId === data.releaseNoteId,
                    );
                    notes[indexToUpdate] = data;
                    this.setDataForDisplay(notes);
                });
            });
    }

    protected get _notesTableColumns() {
        return [
            { name: '#', no_export: true },
            { name: 'Version', key: 'version' },
            { name: 'Title', key: 'title' },
            { name: 'Date Created', key: 'dateCreated' },
        ];
    }
}
