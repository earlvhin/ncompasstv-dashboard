import { TABLE_ROW_FORMAT } from './table-row-format.model';

export class UI_DEALER_PLAYLIST {
    playlist_id: object;
    count: object;
    name: object;
    playlist_description: object;
    date_created: object;
    total_contents: TABLE_ROW_FORMAT;
    allow_export: object;

    constructor(
        playlistId: object,
        count: object,
        name: object,
        playlistDescription: object,
        dateCreated: object,
        totalContents: TABLE_ROW_FORMAT,
        allow_export?: object,
    ) {
        this.playlist_id = playlistId;
        this.count = count;
        this.name = name;
        this.playlist_description = playlistDescription;
        this.date_created = dateCreated;
        this.total_contents = totalContents;
        this.allow_export = allow_export;
    }
}
