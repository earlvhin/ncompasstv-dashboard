import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

import { API_CONTENT } from 'src/app/global/models/api_content.model';

@Component({
    selector: 'app-view-content-list',
    templateUrl: './view-content-list.component.html',
    styleUrls: ['./view-content-list.component.scss'],
})
export class ViewContentListComponent implements OnInit, OnDestroy {
    table_data: {
        columns: { name: string }[];
        rows: {
            title: string;
            type: string;
            duration: number;
            isFullScreen: number;
            url: string;
        }[];
    };
    title = 'Playlist Content List';

    constructor(@Inject(MAT_DIALOG_DATA) public _dialog: { contents: API_CONTENT[] }) {}

    get columns(): { name: string }[] {
        return [
            { name: '#' },
            { name: 'Title' },
            { name: 'Type' },
            { name: 'Duration' },
            { name: 'Fullscreen' },
        ];
    }

    ngOnInit() {
        this.table_data = { columns: this.columns, rows: this.mapToTable() };
    }

    ngOnDestroy() {}

    private mapToTable(): {
        title: string;
        type: string;
        duration: number;
        isFullScreen: number;
        url: string;
    }[] {
        const contents = this._dialog.contents;

        return contents.map((content) => {
            const { title, fileType, duration, isFullScreen, url } = content;
            return { title, type: fileType, duration, isFullScreen, url };
        });
    }
}
