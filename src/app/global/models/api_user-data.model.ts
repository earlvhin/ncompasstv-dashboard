export class API_USER_DATA {
	allowEmail: number;
    contactNumber: string;
    createdBy: string;
    creatorName: string;
    dateCreated: string;
    dateUpdated: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName: string;
    password: string;
    profilePicture: string;
    refreshToken: string;
    status: string;
    updatedBy: string;
    userId: string;
	userRoles?: { permission: string, roleId: string, roleName: string, status: string }[];
	permission?: string;
	ownerId?: string;
}
