export interface API_EXPORT_ADVERTISER {
	name: string;
	state: string;
	status: string;
	assignedUser: string;
	contentCount: number;
	contents: API_EXPORT_CONTENT[];
}

export interface API_EXPORT_CONTENT {
	contentName: string;
	type: string;
	uploadDate: string;
	uploadedBy: string;
}
