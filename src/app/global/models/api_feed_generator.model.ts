import { API_CONTENT } from "./api_content.model";
import { API_DEALER } from "./api_dealer.model";

export class GenerateFeed {
    feeds: FEED_INFO

    feedGlobalSettings: {
        overlay: string,
        fontColor: string,
        fontFamily: string
    }

    feedSlides: {
        contentId: string,
        heading: string,
        paragraph: string,
        duration: number,
        sequence: number
    }[];

    constructor(
        feeds: {
            dealerId: string,
            feedTitle: string,
            description: string,
            createdBy: string,
            feedTypeId: string,
            feedId?: string
        },
        feedGlobalSettings: {
            overlay: string,
            fontColor: string,
            fontFamily: string
        },
        feedSlides: {
            contentId: string,
            heading: string,
            paragraph: string,
            duration: number,
            sequence: number
        }[]
    ) {
        this.feeds = feeds;
        this.feedGlobalSettings = feedGlobalSettings;
        this.feedSlides = feedSlides;
    }
}

export type FEED_INFO = {
    dealerId: string,
    feedTitle: string,
    description: string,
    createdBy: string,
    feedTypeId: string,
    feedId?: string,
    status?: string
}

export type API_GENERATED_FEED = {
    businessName: string,
    createdBy: string,
    contents: API_CONTENT,
    dateCreated: string,
    dateUpdated: string,
    dealerId: string,
    dealer: API_DEALER,
    dealerIdAlias: string,
    description: string,
    feedId: string,
    feedTitle: string,
    status: string,
    updatedBy: string,
    feedType: {
        dateCreated: string,
        description: string,
        feedTypeId: string,
        name: string,
        status: string
    },
    feedSlides: {
        contentId: string,
        contents: API_CONTENT,
        dateCreated: string,
        duration: number,
        feedContentId: string,
        feedId: string,
        heading: string,
        paragraph: string,
        sequence: number
    }[]
}

export class GenerateWeatherFeed {
    feeds: FEED_INFO;
    feedWeather: WEATHER_FEED_STYLE_DATA

    constructor(feeds: FEED_INFO, feedWeather: WEATHER_FEED_STYLE_DATA){
        this.feeds = feeds;
        this.feedWeather = feedWeather;
    }
}

export type WEATHER_FEED_STYLE_DATA = {
    backgroundContentId: string,
    bannerContentId: string,
    boxBackgroundColor: string,
    daysFontColor: string,
    fontFamily: string,
    numberDay: number,
    zipCode: string
}