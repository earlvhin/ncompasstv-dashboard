import { API_ADVERTISER } from './api_advertiser.model';
import { API_HOST } from './api_host.model';
import { API_LICENSE_PROPS } from './api_license.model';
import { API_USER_ROLES } from './api_user-role.model';
import { TAG } from './tag.model';

export class USER_LOGIN {
	userId: string;
	firstName: string;
	middleName: string;
	lastName: string;
	email: string;
	token: string;
	refreshToken: string;
	userRole: API_USER_ROLES;
	roleInfo: any;
	jwt?: any;
}

export class USER {
	allowEmail: number;
	users: Array<any>;
	userId: string;
	firstName: string;
	middleName: string;
	lastName: string;
	email: string;
	password: string;
	profilePicture: string;
	contactNumber: string;
	dateCreated: string;
	dateUpdated: string;
	createdBy: string;
	creatorName: string;
	updatedBy: string;
	status: string;
	token: string;
	refreshToken: string;
	organization: string;
	userRoles: API_USER_ROLES[];
}

export class USER_PROFILE {
	users: Array<any>;
	userId: string;
	dealerId: string;
	firstName: string;
	middleName: string;
	lastName: string;
	email: string;
	password: string;
	profilePicture: string;
	contactNumber: string;
	dateCreated: string;
	dateUpdated: string;
	createdBy: string;
	creatorName: string;
	updatedBy: string;
	status: string;
	token: string;
	refreshToken: string;
	userRoles: API_USER_ROLES;
	address: string;
	region: string;
	city: string;
	state: string;
}

export class DEALER_PROFILE {
	allowEmail: number;
	contactNumber: string;
	createdBy?: string;
	creatorName: string;
	dateCreated: string;
	firstName: string;
	lastName: string;
	middleName?: string;
	organization?: string;
	ownerId?: string;
	password: string;
	profilePicture?: string;
	refreshToken?: string;
	token?: string;
	updatedBy?: string;
	userRoles?: { parentId?: string; permission: string; roleId: string; roleName: string; status: string }[];
	activeHost: string;
	address?: string;
	advertisers: API_ADVERTISER[];
	businessName: string;
	city: string;
	contactPerson: string;
	contractDetails?: string;
	dateUpdated?: string;
	dealerId: string;
	dealerIdAlias: string;
	dealer?: any;
	dealerStats?: any;
	email?: string;
	forInstallationHost: number;
	generalCategory?: string;
	generatedId: string;
	hosts: API_HOST[];
	license?: any;
	licenses: API_LICENSE_PROPS[];
	monthAsDealer: string;
	offlineLicenseCount?: number;
	onlineLicenseCount?: number;
	owner?: string;
	ownerFirstName?: string;
	ownerLastName?: string;
	playerCount: number;
	region: string;
	startDate: string;
	state: string;
	status: string;
	tags: TAG[];
	totalAdvertisers: number;
	totalHost: string;
	totalOnlineLicense: number;
	userId: string;
}

export class JWT_TOKEN {
	token: string;
	refreshToken: string;
}

export interface USER_LOCALSTORAGE {
	user_id: string;
	firstname: string;
	lastname: string;
	role_id: string;
	roleInfo: any;
	jwt: { token: string; refreshToken: string };
}
