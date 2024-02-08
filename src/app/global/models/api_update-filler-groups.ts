export class API_UPDATE_FILLER_GROUP {
    fillergroupid: string;
    name: string;
    paired: number;
    dealers: any[];
    dealeradmins: any[];

    constructor(fillergroupid: string, name: string, paired: number, dealers: any[], dealeradmins: any[]) {
        this.fillergroupid = fillergroupid;
        this.name = name;
        this.paired = paired;
        this.dealers = dealers;
        this.dealeradmins = dealeradmins;
    }
}
