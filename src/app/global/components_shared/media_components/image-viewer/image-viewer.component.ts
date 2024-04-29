import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-image-viewer',
    templateUrl: './image-viewer.component.html',
    styleUrls: ['./image-viewer.component.scss'],
})
export class ImageViewerComponent implements OnInit {
    imageUri: string;
    filename: string;
    filetype: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string; filetype: string; filename: string }) {
        this.imageUri = data.url;
        this.filetype = data.filetype;
        this.filename = data.filename;
    }

    ngOnInit() {}
}
