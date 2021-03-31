export class UI_ADVERTISER {
    advertiser_id: string;
    index: number;
    name: string;
    type: string;
    playing_where: string;
    uploaded_by: string;

    constructor(
        advertiser_id: string, index: number, name: string,
        type: string, playing_where: string, uploaded_by: string
    ) {
        this.advertiser_id = advertiser_id;
        this.index = index;
        this.name = name;
        this.type = type;
        this.playing_where = playing_where;
        this.uploaded_by = uploaded_by;
    }
}
