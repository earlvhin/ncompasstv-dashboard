export class ACTIVITY_LOGS {
	ownerId: string;
	activityCode: string;
	initiatedBy: string;

	constructor(ownerId: string, activityCode: string, initiatedBy: string) {
		this.ownerId = ownerId;
		this.activityCode = activityCode;
		this.initiatedBy = initiatedBy;
	}
}
