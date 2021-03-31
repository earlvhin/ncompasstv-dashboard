import { API_HOST } from "./api_host.model";

export class API_LICENSE {
	license: API_LICENSE_PROPS;
	host: API_HOST;
	screen: screenInfo;
}

export class API_LICENSE_PROPS {
	alias: string;
	anydeskId?: string;
    contentsUpdated: string;
	dateUpdated?: string;
    licenseId: string;
    licenseKey: string;
    macAddress: string;
    isRegistered: number;
    isActivated: number;
    dealerId: string;
    hostId: string;
    dateCreated: string;
    internetType: string;
    internetSpeed: string;
    memory: string;
    totalStorage: string;
    freeStorage: string;
	message: string;
	piStatus: number;
	timeIn?: string;
	installDate?: string;
    screenId?: string;
}

class screenInfo {
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