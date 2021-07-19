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