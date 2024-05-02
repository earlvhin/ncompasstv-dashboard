export class API_ACTIVITY {
    index: any;
    activityCode: any;
    activityLogId: any;
    activityDescription: any;
    dateCreated: any;
    dateUpdated?: any;
    initiatedBy: any;
    initiatedById: any;
    licenseId: any;

    constructor(
        index: any,
        activityCode: any,
        activityLogId: any,
        activityDescription: any,
        dateCreated: any,
        initiatedBy: any,
        initiatedById: any,
        licenseId: any,
        dateUpdated?: any,
    ) {
        this.index = index;
        this.activityCode = activityCode;
        this.activityLogId = activityLogId;
        this.activityDescription = activityDescription;
        this.dateCreated = dateCreated;
        this.dateUpdated = dateUpdated;
        this.initiatedBy = initiatedBy;
        this.initiatedById = initiatedById;
        this.licenseId = licenseId;
    }
}

export class USER_ACTIVITY {
    index: any;
    activityCode: any;
    activityLogId: any;
    activityDescription: any;
    dateCreated: any;
    initiatedBy: any;
    initiatedById: any;
    owner: any;
    ownerId: any;
    targetId: any;
    targetName: any;

    constructor(
        index: any,
        activityCode: any,
        activityLogId: any,
        activityDescription: any,
        dateCreated: any,
        initiatedBy: any,
        initiatedById: any,
        owner: any,
        ownerId: any,
        targetId: any,
        targetName: any,
    ) {
        this.index = index;
        this.activityCode = activityCode;
        this.activityLogId = activityLogId;
        this.activityDescription = activityDescription;
        this.dateCreated = dateCreated;
        this.initiatedBy = initiatedBy;
        this.initiatedById = initiatedById;
        this.owner = owner;
        this.ownerId = ownerId;
        this.targetId = targetId;
        this.targetName = targetName;
    }
}
