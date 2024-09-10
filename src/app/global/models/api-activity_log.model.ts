export interface API_ACTIVITY_LOG {
    activityCode: string;
    activityDescription: string;
    activityLogId: string;
    dateCreated: string;
    dateUpdated?: string;
    initiatedBy: string;
    initiatedById: string;
}

export interface API_LICENSE_ACTIVITY_LOG extends API_ACTIVITY_LOG {
    licenseId: string;
}
