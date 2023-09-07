// import { TABLE_ROW_FORMAT } from '.';

export class UI_HOST_SUPPORT {
	index?: any;
	ticketId?: any;
	hostId?: any;
	dateCreated?: any;
	url?: any;
	notes?: any;
	dateUpdated?: any;
	createdBy?: any;

	constructor(index: any, ticketId: any, hostId: any, dateCreated: any,  url: any, notes: any, dateUpdated: any, createdBy: any) {
		this.index = index;
		this.ticketId = ticketId;
		this.hostId = hostId;
		this.dateCreated = dateCreated;
		this.url = url;
		this.notes = notes;
		this.dateUpdated = dateUpdated;
		this.createdBy = createdBy;
	}
}
