export interface CREATE_WIDGET_FEED {
    feedTitle: string;
    feedDescription?: string;
    embeddedscript: string;
    dealerId?: string;
    createdBy: string;
    classification: 'widget';
}
