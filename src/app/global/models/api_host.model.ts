import { API_LICENSE_PROPS, API_TIMEZONE, TAG, UI_STORE_HOUR } from '.';
import { API_DEALER } from './api_dealer.model';

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
	generalCategory?: string;
	groupId: string;
	host?: any[];
	hostAddress?: string;
	hostId: string;
	hostName: string;
	installDate: string;
	internet: string;
	latitude: string;
	licenses: API_LICENSE_PROPS[];
	logo?: string;
	longitude: string;
	mappedStoreHours?: string;
	monthlyTraffic: string;
	name: string;
	notes: string;
	others?: any;
	postalCode: string;
	region: string;
	state: string;
	status: string;
	storeHours: any;
	storeHoursTotal?: any;
	storeHoursParsed?: UI_STORE_HOUR[];
	street: string;
	tags?: TAG[];
	tagsToString?: string;
	totalLicenses: number;
	totalLicensesPending?: number;
	totalLicences: number;
	timeZone: string; // do not be fooled like me, this is actually the timezone id
	timeZoneData?: API_TIMEZONE; // added this one bec this makes more sense than separating the timezone object
	timezoneName?: string;
	updatedBy: string;
	userId: string;
	venueType: string;
	vistarVenueId: any;
	parsedStoreHours?: any;
	iconUrl?: string;
}

export class API_SINGLE_HOST {
	host: API_HOST;
	timezone?: API_TIMEZONE;
	dealer?: API_DEALER;
	hostTags?: TAG[];
	dealerTags?: TAG[];
	fieldGroups?: any[];
	createdBy?: any[];
}
