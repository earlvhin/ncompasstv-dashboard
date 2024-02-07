import { API_CONTENT } from './api_content.model';
import { API_DEALER } from './api_dealer.model';

/** Slide Feed Model to be submitted to API via POST */
export class GenerateSlideFeed {
    feeds: FEED_INFO;

    feedGlobalSettings: {
        bannerImage: string;
        fontColor: string;
        fontFamily: string;
        headlineColor: string;
        headlingBackground: string;
        overlay: string;
        textAlign: string;
    };

    feedSlides: {
        contentId: string;
        heading: string;
        paragraph: string;
        duration: number;
        sequence: number;
    }[];

    constructor(
        feeds: {
            dealerId: string;
            feedTitle: string;
            description: string;
            createdBy: string;
            feedTypeId: string;
            feedId?: string;
        },
        feedGlobalSettings: {
            bannerImage: string;
            fontColor: string;
            fontFamily: string;
            headlineColor: string;
            headlingBackground: string;
            overlay: string;
            textAlign: string;
        },
        feedSlides: {
            contentId: string;
            heading: string;
            paragraph: string;
            duration: number;
            sequence: number;
        }[],
    ) {
        this.feeds = feeds;
        this.feedGlobalSettings = feedGlobalSettings;
        this.feedSlides = feedSlides;
    }
}

export type FEED_INFO = {
    dealerId: string;
    feedTitle: string;
    description: string;
    createdBy: string;
    feedTypeId: string;
    feedId?: string;
    status?: string;
    updatedBy?: string;
};

export type SLIDE_GLOBAL_SETTINGS = {
    bannerImage: string;
    fontColor: string;
    fontFamily: string;
    headlineColor: string;
    headlineBackground: string;
    imageAnimation: number;
    overlay: string;
    textAlign: string;
};

/** Weather Feed Model to be submitted to API via POST */
export class GenerateWeatherFeed {
    feeds: FEED_INFO;
    feedWeather: WEATHER_FEED_STYLE_DATA;

    constructor(feeds: FEED_INFO, feedWeather: WEATHER_FEED_STYLE_DATA) {
        this.feeds = feeds;
        this.feedWeather = feedWeather;
    }
}

export class GenerateFillerFeed {
    feeds: FEED_INFO;
    feedFillerSettings: FEED_FILLER_SETTINGS;
    feedFillers: FEED_FILLERS[];

    constructor(
        feeds: FEED_INFO,
        feedFillerSettings: FEED_FILLER_SETTINGS,
        feedFillers: FEED_FILLERS[],
    ) {
        this.feeds = feeds;
        this.feedFillerSettings = feedFillerSettings;
        this.feedFillers = feedFillers;
    }
}

/** Model from API via GET */
export type API_GENERATED_FEED = {
    businessName: string;
    createdBy: string;
    contents: API_CONTENT;
    dateCreated: string;
    dateUpdated: string;
    dealerId: string;
    dealer: API_DEALER;
    dealerIdAlias: string;
    description: string;
    feedId: string;
    feedTitle: string;
    status: string;
    updatedBy: string;
    feedType: {
        dateCreated: string;
        description: string;
        feedTypeId: string;
        name: string;
        status: string;
    };
    feedSlides: {
        contentId: string;
        contents: API_CONTENT;
        dateCreated: string;
        duration: number;
        feedContentId: string;
        feedId: string;
        heading: string;
        paragraph: string;
        sequence: number;
    }[];
    feedWeather: WEATHER_FEED_STYLE_DATA;
    feedNews: NEWS_FEED_STYLE_DATA;
    slideGlobalSettings: SLIDE_GLOBAL_SETTINGS;
    bannerImageData: API_CONTENT;
    fillerGlobalSettings: FEED_FILLER_SETTINGS;
    feedFillers: API_CONTENT[];
};

export type WEATHER_FEED_STYLE_DATA = {
    backgroundContentId: string;
    backgroundContents: API_CONTENT;
    bannerContentId: string;
    bannerContents: API_CONTENT;
    boxBackgroundColor: string;
    daysFontColor: string;
    fontFamily: string;
    footerContentId: string;
    footerContents: API_CONTENT;
    footerImageSize: number;
    headerImageSize: number;
    numberDay: number;
    zipCode: string;
    numberDays?: number;
};

export type FEED_FILLER_SETTINGS = {
    min: number;
    num: number;
    feedId?: string;
};

export type FEED_FILLERS = {
    contentId: string;
    sequence: number;
};

/** Weather Feed Model to be submitted to API via POST */
export class GenerateNewsFeed {
    feeds: FEED_INFO;
    feedNews: NEWS_FEED_STYLE_DATA;

    constructor(feeds: FEED_INFO, feedNews: NEWS_FEED_STYLE_DATA) {
        this.feeds = feeds;
        this.feedNews = feedNews;
    }
}

export type NEWS_FEED_STYLE_DATA = {
    backgroundColor: string;
    backgroundContentId: string;
    backgroundContents: API_CONTENT;
    fontColor: string;
    fontSize: string;
    loopCycle: string;
    marginLeft: string;
    marginTop: string;
    results: string;
    rssFeedUrl: string;
    time: string;
};
