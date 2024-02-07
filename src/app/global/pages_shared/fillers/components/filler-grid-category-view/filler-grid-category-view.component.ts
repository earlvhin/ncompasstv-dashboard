import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-filler-grid-category-view',
    templateUrl: './filler-grid-category-view.component.html',
    styleUrls: ['./filler-grid-category-view.component.scss'],
})
export class FillerGridCategoryViewComponent implements OnInit {
    id_to_hide: any = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public dialogData: any,
        public dialogRef: MatDialogRef<FillerGridCategoryViewComponent>,
    ) {}

    ngOnInit() {}

    removeFromGrid(id) {
        this.id_to_hide.push(id);
        this.dialogData = this.dialogData.filter((grid) => {
            return grid.id != id;
        });
    }

    hideAllSelected() {
        this.dialogRef.close(this.id_to_hide);
    }
}
