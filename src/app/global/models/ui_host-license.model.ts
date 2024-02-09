import { TABLE_ROW_FORMAT } from '.';

export class UI_HOST_LICENSE {
    license_id?: TABLE_ROW_FORMAT;
    index?: TABLE_ROW_FORMAT;
    license_key?: TABLE_ROW_FORMAT;
    alias?: TABLE_ROW_FORMAT;
    type?: TABLE_ROW_FORMAT;
    screen?: TABLE_ROW_FORMAT;
    mac_address?: TABLE_ROW_FORMAT;
    internet_type?: TABLE_ROW_FORMAT;
    internet_speed?: TABLE_ROW_FORMAT;
    last_push_update?: TABLE_ROW_FORMAT;
    online_status?: TABLE_ROW_FORMAT;
    offline_status?: TABLE_ROW_FORMAT;
    pi_status?: TABLE_ROW_FORMAT;
    player_status?: TABLE_ROW_FORMAT;
    install_date?: TABLE_ROW_FORMAT;
    request_date?: TABLE_ROW_FORMAT;
}

export class UI_HOST_VIEW {
    index: object;
    host_id: object;
    name: object;
    business_name: object;
    address: object;
    city: object;
    state: object;
    street: object;
    postal_code: object;
    timezone_name: object;
    total_licenses: object;
    status: object;
    constructor(
        index: object,
        host_id: object,
        name: object,
        business_name: object,
        address: object,
        city: object,
        state: object,
        postal_code: object,
        timezone_name: object,
        total_licenses: object,
        status: object,
    ) {
        this.index = index;
        this.host_id = host_id;
        this.name = name;
        this.business_name = business_name;
        this.address = address;
        this.city = city;
        this.state = state;
        this.postal_code = postal_code;
        this.timezone_name = timezone_name;
        this.total_licenses = total_licenses;
        this.status = status;
    }
}

export class UI_HOST_DMA {
    index: object;
    rank: object;
    number_of_hosts: object;
    dma_code: object;
    dma_name: object;
    constructor(index: object, rank: object, number_of_hosts: object, dma_code: object, dma_name: object) {
        this.index = index;
        this.rank = rank;
        this.number_of_hosts = number_of_hosts;
        this.dma_code = dma_code;
        this.dma_name = dma_name;
    }
}
