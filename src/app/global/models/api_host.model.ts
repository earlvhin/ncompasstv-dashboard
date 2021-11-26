import { TAG } from '.';
import { API_DEALER } from './api_dealer.model';
import { API_LICENSE } from './api_license.model';

export class API_HOST {
	host: Array<any>;
	licenses: API_LICENSE[];
	hostId: string;
	dealerId: string;
	userId: string;
	name: string;
	address: string;
	street: string;
	city: string;
	postalCode: string;
	region: string;
	state: string;
	country: string;
	groupId: string;
	latitude: string;
	logo?: string;
	longitude: string;
	timeZone: string;
	storeHours: string;
	venueType: string;
	monthlyTraffic: string;
	avgDwellTime: string;
	avgTicket: string;
	demographics: string;
	internet: string;
	notes: string;
	installDate: string;
	dateCreated: string;
	dateUpdated: string;
	createdBy: string;
	updatedBy: string;
	status: string;
	tags?: TAG[];
	totalLicenses: number;
	totalLicences: number;
	category: string;
	hostName: string;
	businessName: string;
	timezoneName: string;
	others?: any;
	parsedStoreHours?: any;
    icon_url?: any;
}

export class API_SINGLE_HOST {
	host: {
		licenses: API_LICENSE[];
		hostId: string;
		dealerId: string;
		userId: string;
		name: string;
		address: string;
		street: string;
		city: string;
		postalCode: string;
		region: string;
		state: string;
		country: string;
		groupId: string;
		latitude: string;
		logo?: string;
		longitude: string;
		timeZone: string;
		storeHours: string;
		venueType: string;
		monthlyTraffic: string;
		avgDwellTime: string;
		avgTicket: string;
		demographics: string;
		internet: string;
		notes: string;
		installDate: string;
		dateCreated: string;
		dateUpdated: string;
		createdBy: string;
		updatedBy: string;
		status: string;
		totalLicenses: number;
		category: string;
		tags?: TAG[];
	};

	timezone?:  {
		id: string,
		name: string,
		status: string
	};

	dealer: API_DEALER;
	hostTags: any;
}