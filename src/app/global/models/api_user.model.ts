import { API_USER_ROLES } from './api_user-role.model';

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
    users: Array<any>;
    userId: string;
    dealerId: string;
    dealerIdAlias: string;
    firstName: string;
    lastName: string;
    email: string;
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
    contactPerson: string;
    businessName: string;
}

export class JWT_TOKEN {
    token: string;
    refreshToken: string;
}