export class API_UPDATE_USER_INFO {
    userId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    password: string;
    allowEmail: number;

    constructor(userId: string, fname: string, mname: string, lname: string, email: string, password: string, allowEmail = 0) {
        this.userId = userId;
        this.firstName = fname;
        this.middleName = mname;
        this.lastName = lname;
        this.email = email;
        this.password = password;
        this.allowEmail = allowEmail;
    }
}

export class API_UPDATE_USER_PROFILE {
    userId: string;
    contactNumber: string;
    firstName: string;
    lastName: string;

    constructor(userId: string, contactNumber: string, firstName: string, lastName: string) {
        this.userId = userId;
        this.contactNumber = contactNumber;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}

export class API_UPDATE_DEALER_PROFILE {
    userId: string;
    dealerId: string;
    contactPerson: string;
    businessName: string;
    updatedBy: string;
    contactNumber: string;

    constructor(userId: string, dealerId: string, contactPerson: string, businessName: string, updatedBy: string, contactNumber: string) {
        this.userId = userId;
        this.dealerId = dealerId;
        this.contactPerson = contactPerson;
        this.businessName = businessName;
        this.updatedBy = updatedBy;
        this.contactNumber = contactNumber;
    }
}

export class API_UPDATE_DEALER_PROFILE_BY_ADMIN {
    userId: string;
    dealerId: string;
    contactPerson: string;
    playerCount: string;
    businessName: string;
    dealerIdAlias: string;
    email: string;
    contactNumber: string;
    address: string;
    region: string;
    city: string;
    state: string;
    startDate: Date;
    updatedBy: string;

    constructor(
        userId: string,
        dealerId: string,
        contactPerson: string,
        playerCount: string,
        businessName: string,
        dealerIdAlias: string,
        email: string,
        contactNumber: string,
        address: string,
        region: string,
        city: string,
        state: string,
        startDate: Date,
        updatedBy: string
    ) {
        this.userId = userId;
        this.dealerId = dealerId;
        this.contactPerson = contactPerson;
        this.playerCount = playerCount;
        this.businessName = businessName;
        this.dealerIdAlias = dealerIdAlias;
        this.email = email;
        this.contactNumber = contactNumber;
        this.address = address;
        this.region = region;
        this.city = city;
        this.state = state;
        this.startDate = startDate;
        this.updatedBy = updatedBy;
    }
}

export class API_UPDATE_DEALER_USER_PROFILE {
    userId: string;
    dealerId: string;
    firstName: string;
    lastName: string;

    constructor(userId: string, dealerId: string, firstName: string, lastName: string) {
        this.userId = userId;
        this.dealerId = dealerId;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}

export class API_UPDATE_DEALER_USER_PROFILE_BY_ADMIN {
    userId: string;
    dealerId: string;
    firstName: string;
    lastName: string;
    email: string;

    constructor(userId: string, dealerId: string, firstName: string, lastName: string, email: string) {
        this.userId = userId;
        this.dealerId = dealerId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }
}
