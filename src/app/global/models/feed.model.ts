export interface FEED {
    businessName: string;
    classification: string;
    contentId: string;
    createdBy: string;
    createdByName: string;
    dateCreated: string;
    dealerId: string;
    description: string;
    feedId: string;
    fileType: string;
    prefix: string;
    refDealerId: string;
    title: string;
    url: string;
    embeddedScript?: string;
}

export interface UPSERT_WIDGET_FEED {
    feedTitle: string;
    feedDescription?: string;
    embeddedScript: string;
    dealerId?: string;
    createdBy: string;
    classification: 'widget';
}
