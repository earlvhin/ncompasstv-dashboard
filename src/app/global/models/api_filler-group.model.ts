export class API_FILLER_GROUP {
    blacklistedDealerAdmins: string;
    blacklistedDealers: [];
    bucketName: string;
    count: number;
    coverPhoto: string;
    createdBy: string;
    createdByName: string;
    dateCreated: string;
    dateUpdated: string;
    dealerId: string;
    description: string;
    fillerGroupId: string;
    name: string;
    paired: number;
    quantity: number;
    role: number;
    status: string;
    updatedBy: string;
    updatedByName: string;

    constructor(
        blacklistedDealerAdmins: string,
        blacklistedDealers: [],
        bucketName: string,
        count: number,
        coverPhoto: string,
        createdBy: string,
        createdByName: string,
        dateCreated: string,
        dateUpdated: string,
        dealerId: string,
        description: string,
        fillerGroupId: string,
        name: string,
        paired: number,
        quantity: number,
        role: number,
        status: string,
        updatedBy: string,
        updatedByName: string,
    ) {
        this.blacklistedDealerAdmins = blacklistedDealerAdmins;
        this.blacklistedDealers = blacklistedDealers;
        this.bucketName = bucketName;
        this.count = count;
        this.coverPhoto = coverPhoto;
        this.createdBy = createdBy;
        this.createdByName = createdByName;
        this.dateCreated = dateCreated;
        this.dateUpdated = dateUpdated;
        this.dealerId = dealerId;
        this.description = description;
        this.fillerGroupId = fillerGroupId;
        this.name = name;
        this.paired = paired;
        this.quantity = quantity;
        this.role = role;
        this.status = status;
        this.updatedBy = updatedBy;
        this.updatedByName = updatedByName;
    }
}
