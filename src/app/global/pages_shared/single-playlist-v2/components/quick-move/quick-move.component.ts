import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ButtonGroup } from '../../type/ButtonGroup';
import { MAT_DIALOG_DATA } from '@angular/material';
import { API_CONTENT } from 'src/app/global/models';

@Component({
    selector: 'app-quick-move',
    templateUrl: './quick-move.component.html',
    styleUrls: ['./quick-move.component.scss'],
})
export class QuickMoveComponent implements OnInit {
    quickMoveForm: FormGroup;
    playlistContent;
    playlistCount = 0;

    constructor(
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            playlistContent: API_CONTENT;
            playlistContentCount: number;
        },
    ) {
        this.playlistContent = this.data.playlistContent;
        this.playlistCount = this.data.playlistContentCount;
    }

    ngOnInit() {
        this.quickMoveForm = this._formBuilder.group({
            seq: [this.playlistContent.seq, [Validators.required, this.numberRangeValidator(this.playlistCount)]],
        });
    }

    numberRangeValidator(maxValue: number): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            const value = Number(control.value);

            if (isNaN(value) || value < 1 || value > maxValue) {
                return { numberRange: true };
            }

            return null;
        };
    }
}
