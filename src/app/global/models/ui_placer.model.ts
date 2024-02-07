export class UI_PLACER_DATA {
    index: any;
    placer_id: any;
    placer_name: any;
    host_name: any;
    foot_traffic: any;
    address: any;
    average_dwell_time: any;
    month: any;
    upload_date: any;
    upload_by: any;
    publication_date: any;
    source_file: any;
    placer_dump_id: any;
    constructor(
        index: any,
        placer_id: any,
        placer_name: any,
        host_name: any,
        address: any,
        foot_traffic: any,
        average_dwell_time: any,
        month: any,
        upload_date: any,
        upload_by: any,
        publication_date: any,
        source_file: any,
        placer_dump_id: any
    ) {
        this.index = index;
        this.placer_id = placer_id;
        this.placer_name = placer_name;
        this.host_name = host_name;
        this.address = address;
        this.foot_traffic = foot_traffic;
        this.average_dwell_time = average_dwell_time;
        this.month = month;
        this.upload_date = upload_date;
        this.upload_by = upload_by;
        this.publication_date = publication_date;
        this.source_file = source_file;
        this.placer_dump_id = placer_dump_id;
    }
}
