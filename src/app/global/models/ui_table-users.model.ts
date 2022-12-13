export class UI_TABLE_USERS {
    user_id: object;
    index: object;
    name: object;
    email: object;
    contact_number: object;
    role: object;
    date_created: object;
    created_by: object;
	affiliation: object;
	allow_email: object;

    constructor(
        id: object, i: object, name: object, email: object, contact: object,
        role: object, date: object, created_by: object, affiliation: object,
		allow_email: object,
    ) {
        this.user_id = id;
        this.index = i;
        this.name = name;
        this.email = email;
        this.contact_number = contact;
        this.role = role;
        this.date_created = date;
        this.created_by = created_by;
        this.affiliation = affiliation;
        this.allow_email = allow_email;
    }
}

export class DEALERADMIN_UI_TABLE_USERS {
    user_id: object;
    index: object;
    name: object;
    email: object;
    contact_number: object;
    role: object;
    affiliation: object;
    date_created: object;
    created_by: object;

    constructor(
        id: object, i: object, name: object, email: object, contact: object,
        role: object, affiliation: object, date: object, created_by: object
    ) {
        this.user_id = id;
        this.index = i;
        this.name = name;
        this.email = email;
        this.contact_number = contact;
        this.role = role;
        this.affiliation = affiliation;
        this.date_created = date;
        this.created_by = created_by;
    }
}
