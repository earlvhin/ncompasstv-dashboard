import { TABLE_ROW_FORMAT } from './table-row-format.model';

export class UI_TABLE_PLAYLIST {
    playlist_id: object;
    count: object;
    name: object;
    date: object;
    author: object;
    allow_export: object;
    total_contents: TABLE_ROW_FORMAT;

    constructor(
        playlist_id: object,
        count: object,
        name: object,
        date: object,
        author: object,
        total_contents: TABLE_ROW_FORMAT,
        allow_export: object,
    ) {
        this.playlist_id = playlist_id;
        this.count = count;
        this.name = name;
        this.date = date;
        this.author = author;
        this.total_contents = total_contents;
        this.allow_export = allow_export;
    }
}
