import { API_DEALER } from './api_dealer.model';
import { API_USER_DATA } from './api_user-data.model';

export class API_FEED {
    feed: {
        feedId: string;
        contentId: string;
        createdBy: string;
        dateCreated: string;
        dealerId: string;
        feedDescription: string;
        classification: string;
        feedTitle: string;
        feedUrl: string;
        fileType: string;
        thumbnail: string;
    };
    dealer: API_DEALER;
    owner: API_USER_DATA;
}

export class API_CREATE_FEED {
    feedTitle: string;
    feedDescription: string;
    feedUrl: string;
    dealerId: string;
    createdBy: string;
    classification: string;

    constructor(title, desc, url, dealer, author, classification) {
        this.feedTitle = title;
        this.feedDescription = desc;
        this.feedUrl = url;
        this.dealerId = dealer;
        this.createdBy = author;
        this.classification = classification;
    }
}

export class API_EDIT_FEED {
    contentId: string;
    feedTitle: string;
    feedDescription: string;
    feedUrl: string;

    constructor(id, title, description, url) {
        this.contentId = id;
        this.feedTitle = title;
        this.feedDescription = description;
        this.feedUrl = url;
    }
}

export type API_FEED_TYPES = {
    dateCreated: string;
    description: string;
    feedTypeId: string;
    name: string;
    status: string;
};
