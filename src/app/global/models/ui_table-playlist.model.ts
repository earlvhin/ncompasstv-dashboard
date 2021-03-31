export class UI_TABLE_PLAYLIST {
    playlist_id: object;
    count: object;
    name: object;
    // description: object;
    date: object;
    // update: string;
    author: object;
    
    constructor(playlist_id: object, count: object, name: object, date: object, 
        // update: string,
        author: object) {
        this.playlist_id = playlist_id;
        this.count = count;
        this.name = name;
        // this.description = description;
        this.date = date;
        // this.update = update;
        this.author = author;
    }
}
