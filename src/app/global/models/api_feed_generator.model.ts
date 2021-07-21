export class GenerateFeed {
    feeds: {
        dealerId: string,
        feedTitle: string,
        description: string,
        createdBy: string
    };

    feedContents: {
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
            createdBy: string
        },
        feedContents: {
            contentId: string,
            heading: string,
            paragraph: string,
            duration: number,
            sequence: number
        }[]
    ) {
        this.feeds = feeds;
        this.feedContents = feedContents;
    }
}

export type API_GENERATED_FEED = {
    feeds: {
        businessName: string,
        createdBy: string,
        dateCreated: string,
        dateUpdated: string,
        dealerId: string,
        dealerIdAlias: string,
        description: string,
        feedId: string,
        feedTitle: string,
        status: string,
        updatedBy: string
    },
    feedContents: {
        contentId: string,
        dateCreated: string,
        duration: number,
        feedContentId: string,
        feedId: string,
        heading: string,
        paragraph: string,
        sequence: number
    }[]
}