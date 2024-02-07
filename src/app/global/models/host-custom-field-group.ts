export class FieldGroup {
    fieldGroupName: string;

    constructor(name: string) {
        this.fieldGroupName = name;
    }
}

export class Fields {
    fieldName: string;
    fieldType: string;
    fieldLength: number;

    constructor(name: string, type: string, length: number) {
        this.fieldName = name;
        this.fieldType = type;
        this.fieldLength = length;
    }
}

export class CustomFieldGroup {
    fieldGroup: FieldGroup;
    fields: Fields[];

    constructor(fieldGroup: FieldGroup, fields: Fields[]) {
        this.fieldGroup = fieldGroup;
        this.fields = fields;
    }
}

export type CustomFields = {
    createdDate: string;
    fieldGroupId: string;
    fieldGroupName: string;
    updateDate: string;
};

export type FieldGroupFields = {
    createdDate: string;
    fieldGroupId: string;
    fieldId: string;
    fieldLength: number;
    fieldName: string;
    fieldType: string;
    updateDate: string;
};

export type FieldsAPI = {
    fields: FieldGroupFields[];
};
