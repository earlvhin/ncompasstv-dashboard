export class UI_ACTIVITY_LOGS {
	index?: any;
	ownerId: any;
	activityLogId: any;
	dateCreated: any;
	activityCode: any;
	initiatedBy: any;
	dateUpdated: any;

	constructor(index: any, ownerId: any, activityLogId: any, dateCreated: any, activityCode: any, initiatedBy: any, dateUpdated: any) {
		this.index = index;
		this.ownerId = ownerId;
		this.activityLogId = activityLogId;
		this.dateCreated = dateCreated;
		this.activityCode = activityCode;
		this.initiatedBy = initiatedBy;
		this.dateUpdated = dateUpdated;
	}
}
