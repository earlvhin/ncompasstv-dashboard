import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'app-rename-modal',
    templateUrl: './rename-modal.component.html',
    styleUrls: ['./rename-modal.component.scss'],
})
export class RenameModalComponent implements OnInit {
    public update_file: FormGroup;
    public filenameError$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    public isButtonDisabled$: Observable<boolean>;
    public originalFilename: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
        public dialogRef: MatDialogRef<RenameModalComponent>,
        private _form: FormBuilder,
    ) {
        this.originalFilename = _dialog_data.originalFilename;
        this.dialogRef.disableClose = true;
    }

    ngOnInit(): void {
        this.update_file = this._form.group({
            filename: [null, Validators.required],
        });

        this.setupButtonState();
        const filenameControl = this.update_file.get('filename');
        if (filenameControl) filenameControl.valueChanges.subscribe(this.checkForDuplicates.bind(this));
    }

    /**
     * Sets up the observable to track the button's disabled state based on form validity, filename errors, and empty input.
     * This ensures that the button is only enabled when the form is valid and the filename is non-empty and unique.
     * @returns {void}
     */
    private setupButtonState(): void {
        const filenameControl = this.update_file.get('filename');
        if (filenameControl) {
            this.isButtonDisabled$ = combineLatest([
                this.filenameError$,
                this.update_file.statusChanges.pipe(startWith(this.update_file.status)),
                filenameControl.valueChanges.pipe(startWith(filenameControl.value || '')),
            ]).pipe(map(([filenameError, status, value]) => status === 'INVALID' || !!filenameError || !value.trim()));
        }
    }

    /**
     * Checks for duplicate filenames by comparing the input filename to existing filenames (ignoring extensions).
     * If a duplicate filename is found, it updates the `filenameError$` observable with an error message.
     * @param {string} newFilename - The new filename input by the user
     * @returns {void}
     */
    private checkForDuplicates(newFilename: string): void {
        if (!newFilename || newFilename.trim().length === 0) {
            this.filenameError$.next(null);
            return;
        }

        const newFilenameWithoutExtension = newFilename.trim().split('.')[0].toLowerCase();
        const existingFilenamesWithoutExtensions = this._dialog_data.existingFilenames.map((filename: string) =>
            filename.split('.')[0].toLowerCase(),
        );

        const duplicates = existingFilenamesWithoutExtensions.filter(
            (filename: string) => filename === newFilenameWithoutExtension,
        );

        this.filenameError$.next(
            duplicates.length > 0 ? 'This filename already exists. Please choose a different name.' : null,
        );
    }

    /**
     * Determines whether the update button should be disabled based on the form validity and the filename input.
     * @returns {boolean} - True if the form is invalid or the filename is empty, otherwise false.
     */
    public isUpdateButtonDisabled(): boolean {
        const filenameControl = this.update_file.get('filename');
        return (
            this.update_file.invalid ||
            !!this.filenameError$.getValue() ||
            !filenameControl ||
            !filenameControl.value.trim()
        );
    }

    /**
     * Closes the dialog with the new filename if no errors are present and the filename is valid.
     * This method is called when the user clicks the "Update" button.
     * @returns {void}
     */
    public updateFile(): void {
        const filenameControl = this.update_file.get('filename');
        if (!filenameControl || this.filenameError$.getValue()) return;

        const newFilename = filenameControl.value ? filenameControl.value.trim().toLowerCase() : '';
        if (!newFilename) return;

        this.dialogRef.close(newFilename); // Close dialog and pass the new filename
    }

    /**
     * Closes the dialog without saving any changes.
     * This method is called when the user clicks the "Cancel" button.
     * @returns {void}
     */
    public cancel(): void {
        this.dialogRef.close(null); // Close dialog and pass null to indicate no action
    }
}
