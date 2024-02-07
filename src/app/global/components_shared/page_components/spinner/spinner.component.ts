import { Component, OnInit, Input } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-spinner',
    templateUrl: './spinner.component.html',
    styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent implements OnInit {
    // Spinner Config
    mode: ProgressSpinnerMode = 'determinate';
    value: number = 40;
    @Input() diameter: number;

    constructor() {}

    ngOnInit() {}
}
