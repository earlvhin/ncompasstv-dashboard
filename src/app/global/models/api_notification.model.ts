export interface NotificationsPaginated {
    entities: Notification[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
    pageSize: number;
    pageStart: number;
    pages: number;
    totalEntities: number;
}

export interface Notification {
    businessName: string;
    dateTime: string;
    dealerId: string;
    isOpened: number;
    licenseAlias: string;
    licenseId: string;
    licenseKey: string;
    notificationId: string;
    status: number;
    timeZone: string;
    hostName: string;
}
