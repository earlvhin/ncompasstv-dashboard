export class UI_TABLE_PLAYLIST {
    playlist_id: object;
    count: object;
    name: object;
    date: object;
    author: object;
    allow_export: object;

    constructor(
        playlist_id: object,
        count: object,
        name: object,
        date: object,
        author: object,
        allow_export: object,
    ) {
        this.playlist_id = playlist_id;
        this.count = count;
        this.name = name;
        this.date = date;
        this.author = author;
        this.allow_export = allow_export;
    }
}
