import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';

@Component({
    selector: 'app-view-cards',
    templateUrl: './view-cards.component.html',
    styleUrls: ['./view-cards.component.scss'],
})
export class ViewCardsComponent implements OnInit {
    cards: any;

    constructor(@Inject(MAT_DIALOG_DATA) public _dialog_data: any) {}

    ngOnInit() {
        this.cards = this._dialog_data;
    }
}
