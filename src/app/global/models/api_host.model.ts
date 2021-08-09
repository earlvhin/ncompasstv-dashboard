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
	};

	timezone?:  {
		id: string,
		name: string,
		status: string
	};

	dealer: API_DEALER;
	hostTags: any;
}