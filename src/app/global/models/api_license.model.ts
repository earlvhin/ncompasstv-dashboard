import { API_HOST } from './api_host.model';

export class API_LICENSE {
	dealer_license?: API_DEALER_LICENSE;
	host: API_HOST;
	license: API_LICENSE_PROPS;
	screen: screenInfo;
	screenType: { dateCreated: string; dateUpdated: string; description: string; name: string; screenTypeId: string };
	timezone?: { id: string; name: string; status: string };
	totalContents?: number;
}

export interface API_LICENSE_PROPS {
	alias: string;
	anydeskId: string;
	appVersion: string;
	apps?: any;
	bootDelay?: any;
	businessName?: string;
	category: string;
	contentsUpdated: string;
	d?: any; // you will be removed when I have the time
	dateCreated: string;
	dateUpdated: string;
	dealerId: string;
	displayStatus?: any;
	emailSettings?: number;
	freeStorage: string;
	hostAddress: string;
	hostId: string;
	hostName: string;
	installDate: string;
	internetInfo: string;
	internetSpeed: string;
	internetType: string;
	isActivated?: any;
	isCecEnabled?: number;
	isRegistered: number;
	lastDisconnect?: string; // for export
	lastPush?: string; // for export
	licenseId: string;
	licenseKey: string;
	macAddress: string;
	memory: string;
	new_status?: string;
	notificationSettings?: number;
	password?: string;
	piSocketId: string;
	piStatus?: any;
	piVersion?: string;
	playerSocketId: any;
	playerStatus: number;
	rebootTime?: string;
	resourceSettings: number;
	screenId: string;
	screenName: string;
	screenTypeId?: string;
	screenTypeName?: string;
	screenType: string;
	screenshotSettings: number;
	screenshotUrl: string;
	server?: string;
	serverVersion: string;
	speedtestSettings: number;
	status?: string;
	storeHours: string;
	tags?: { name: string; tagColor: string }[] | string[];
	tagsToString?: string;
	templateBackground?: string;
	templateBottom?: string;
	templateHorizontal?: string;
	templateHorizontalSmall?: string;
	templateId?: string;
	templateLowerLeft?: string;
	templateMain?: string;
	templateName?: string;
	templateUpperLeft?: string;
	templateVertical?: string;
	timeIn: string;
	timeOut: string;
	timezoneName: string;
	totalStorage: string;
	tvBrand?: string;
	ui?: string;
	uiVersion: string;
	zone?: string;
	tvDisplaySettings?: number;
	fastEdgeMonitoringTool?: number;
}

interface screenInfo {
	screenId: string;
	screenName: string;
	description: string;
	dealerId: string;
	hostId: string;
	templateId: string;
	createdBy: string;
	dateCreated: string;
	dateUpdated: string;
	templateName?: string;
}

export class API_DEALER_LICENSE {
	dealerId: string;
	hostId: string;
	licenseAlias: string;
	licenseId: string;
	licenseKey: string;

	constructor(dealerId, hostId, licenseAlias, licenseId, licenseKey) {
		this.dealerId = dealerId;
		this.hostId = hostId;
		this.licenseAlias = licenseAlias;
		this.licenseId = licenseId;
		this.licenseKey = licenseKey;
	}
}
