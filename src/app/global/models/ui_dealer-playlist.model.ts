export class UI_DEALER_PLAYLIST {
    playlist_id: object;
    count: object;
    playlist_name: object;
    playlist_desc: object;
    date_created: object;

    constructor(
        playlistId: object, count: object, playlistName: object, playlistDescription: object, 
        dateCreated: object, 
    ) {
        this.playlist_id = playlistId;
        this.count = count;
        this.playlist_name = playlistName;
        this.playlist_desc = playlistDescription;
        this.date_created = dateCreated;
    }
}