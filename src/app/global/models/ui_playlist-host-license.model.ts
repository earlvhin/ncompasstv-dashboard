export class UI_PLAYLIST_HOST_LICENSE {
    id: string;
    dealer_id: string;
    host_name: string;
    licenses: UI_PLAYLIST_LICENSE[];
    status: boolean;

    constructor(id: string, dealer: string, name: string, licenses: UI_PLAYLIST_LICENSE[], status: boolean) {
        this.id = id;
        this.dealer_id = dealer;
        this.host_name = name;
        this.licenses = licenses;
        this.status = status;
    }
}

export class UI_PLAYLIST_LICENSE {
    license_id: string;
    license_key: string;
    not_blacklisted: boolean;

    constructor(id: string, key: string, not_blacklisted: boolean) {
        this.license_id = id;
        this.license_key = key;
        this.not_blacklisted = not_blacklisted;
    }
}
