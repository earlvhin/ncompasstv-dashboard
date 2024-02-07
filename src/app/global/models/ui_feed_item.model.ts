export class FeedItem {
    context: {
        heading: string;
        duration: number;
        paragraph: string;
    };

    image: {
        content_id: string;
        filename: string;
        filetype: string;
        preview_url: string;
        file_url: string;
    };

    constructor(
        context: {
            heading: string;
            duration: number;
            paragraph: string;
        },
        image: {
            content_id: string;
            filename: string;
            filetype: string;
            preview_url: string;
            file_url: string;
        },
    ) {
        this.context = context;
        this.image = image;
    }
}
