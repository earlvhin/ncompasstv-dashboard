import { MAT_DATE_FORMATS } from '@angular/material/core';
import { Directive } from '@angular/core';

export const FORMAT = {
    parse: {
        dateInput: 'YYYY-MM-DD',
    },
    display: {
        dateInput: 'MMMM YYYY',
        monthYearLabel: 'MMMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

@Directive({
    selector: '[monthDayFormat]',
    providers: [{ provide: MAT_DATE_FORMATS, useValue: FORMAT }],
})
export class MonthDayFormatDirective {
    constructor() {}
}
