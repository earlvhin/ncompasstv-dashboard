export class UI_TABLE_ADVERTISERS_CONTENT {
    id: string;
    index: number;
    name: string;
    type: string;
    playing_where: string;
    uploaded_by: string;

    constructor(
        id: string, index: number, name: string, 
        type: string, playing_where: string, uploaded_by: string
    ) {
        this.id = id;
        this.index = index;
        this.name = name;
        this.type = type;
        this.playing_where = playing_where;
        this.uploaded_by = uploaded_by;
    }
}
