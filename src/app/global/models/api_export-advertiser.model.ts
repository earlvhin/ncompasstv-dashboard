export interface API_EXPORT_ADVERTISER {
	name: string;
	status: string;
	assignedUser: string;
	contentCount: number;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	dateCreated: string;
	contents: API_EXPORT_CONTENT[];
}

export interface API_EXPORT_CONTENT {
	contentName: string;
	type: string;
	uploadDate: string;
	uploadedBy: string;
}
