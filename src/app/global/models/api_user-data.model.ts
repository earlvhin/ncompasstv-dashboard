export class API_USER_DATA {
    allowEmail: number;
    contactNumber: string;
    creatorName: string;
    dateCreated: string;
    dateUpdated: string;
    email: string;
    firstName: string;
    lastName: string;
    createdBy?: string;
    advertiser: any;
    dealer?: any;
    host?: any;
    middleName?: string;
    organization?: string;
    ownerId?: string;
    password: string;
    profilePicture?: string;
    refreshToken?: string;
    status?: string;
    token?: string;
    updatedBy?: string;
    userId: string;
    userRoles?: {
        parentId?: string;
        permission: string;
        roleId: string;
        roleName: string;
        status: string;
    }[];
    permission?: string;
}
