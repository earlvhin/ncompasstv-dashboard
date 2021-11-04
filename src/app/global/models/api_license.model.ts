import { API_HOST } from "./api_host.model";

export class API_LICENSE {
	license: API_LICENSE_PROPS;
	host: API_HOST;
	screen: screenInfo;
}

export interface API_LICENSE_PROPS {
	alias: string;
	anydeskId: string;
	appVersion: string;
	category: string;
	contentsUpdated: string;
	dateCreated: string
	dateUpdated: string
	dealerId: string;
	displayStatus: number;
	freeStorage: string;
	hostAddress: string;
	hostId: string;
	hostName: string;
	installDate: string;
	internetInfo: string;
	internetSpeed: string;
	internetType: string;
	isActivated: number;
	isRegistered: number;
	licenseId: string;
	licenseKey: string;
	macAddress: string;
	memory: string;
	piSocketId: string;
	piStatus: number;
	playerSocketId: any;
	playerStatus: number;
	resourceSettings: number;
	screenId: string;
	screenName: string;
	screenTypeId?: string;
	screenTypeName?: string;
	screenType: string;
	screenshotSettings: number;
	screenshotUrl: string;
	serverVersion: string;
	speedtestSettings: number;
	storeHours: string;
	tags: { name: string, tagColor: string }[];
	templateId: string;
	templateName: string;
	timeIn: string;
	timeOut: string;
	timezoneName: string;
	totalStorage: string;
	uiVersion: string;
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