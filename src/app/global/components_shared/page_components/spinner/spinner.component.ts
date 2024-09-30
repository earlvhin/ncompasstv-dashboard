import { Component, OnInit, Input } from '@angular/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-spinner',
    templateUrl: './spinner.component.html',
    styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent implements OnInit {
    public mode: ProgressSpinnerMode = 'determinate';
    public value: number = 40;
    @Input() diameter: number;
    @Input() message: string = '';

    constructor() {}

    ngOnInit() {}

    public get hasMessage(): boolean {
        return this.message.trim().length > 0 && this.message !== null;
    }
}
