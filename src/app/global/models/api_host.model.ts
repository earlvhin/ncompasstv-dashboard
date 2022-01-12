import { TAG } from '.';
import { API_DEALER } from './api_dealer.model';
import { API_LICENSE } from './api_license.model';

export class API_HOST {
	address: string;
	avgDwellTime: string;
	avgTicket: string;
	businessName: string;
	category: string;
	city: string;
	country: string;
	createdBy: string;
	dateCreated: string;
	dateUpdated: string;
	dealerId: string;
	demographics: string;
	groupId: string;
	host?: any[];
	hostId: string;
	hostName: string;
	installDate: string;
	internet: string;
	latitude: string;
	licenses: API_LICENSE[];
	logo?: string;
	longitude: string;
	monthlyTraffic: string;
	name: string;
	notes: string;
	others?: any;
	postalCode: string;
	region: string;
	state: string;
	status: string;
	storeHours: any;
	street: string;
	tags?: TAG[];
	tagsToString?: string;
	totalLicenses: number;
	totalLicences: number;
	timeZone: string;
	timezoneName: string;
	updatedBy: string;
	userId: string;
	venueType: string;
	vistarVenuId: any;
	parsedStoreHours?: any;
    icon_url?: any;
}

export class API_SINGLE_HOST {
	host: {
		address: string;
		avgDwellTime: string;
		avgTicket: string;
		businessName: string;
		category: string;
		city: string;
		country: string;
		createdBy: string;
		dateCreated: string;
		dateUpdated: string;
		dealerId: string;
		demographics: string;
		groupId: string;
		host?: any[];
		hostId: string;
		hostName: string;
		installDate: string;
		internet: string;
		latitude: string;
		licenses: API_LICENSE[];
		logo?: string;
		longitude: string;
		monthlyTraffic: string;
		name: string;
		notes: string;
		others?: any;
		postalCode: string;
		region: string;
		state: string;
		status: string;
		storeHours: any;
		street: string;
		tags?: TAG[];
		timeZone: string;
		timezoneName: string;
		totalLicenses: number;
		updatedBy: string;
		userId: string;
		venueType: string;
		vistarVenuId: any;
	};

	timezone?:  {
		id: string,
		name: string,
		status: string
	};

	dealer: API_DEALER;
	hostTags: any;
}