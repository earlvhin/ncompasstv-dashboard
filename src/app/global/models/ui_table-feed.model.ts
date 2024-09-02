import { TABLE_ROW_FORMAT } from './table-row-format.model';

interface BaseTableFeed {
    id: TABLE_ROW_FORMAT;
    feed_id: TABLE_ROW_FORMAT;
    index: TABLE_ROW_FORMAT;
    title: TABLE_ROW_FORMAT;
    classification: TABLE_ROW_FORMAT;
    created_by: TABLE_ROW_FORMAT;
    date_created: TABLE_ROW_FORMAT;
    feed_url: TABLE_ROW_FORMAT;
    description: TABLE_ROW_FORMAT;
    embeddedScript?: TABLE_ROW_FORMAT;
}

export class UI_TABLE_FEED implements BaseTableFeed {
    id: TABLE_ROW_FORMAT;
    feed_id: TABLE_ROW_FORMAT;
    index: TABLE_ROW_FORMAT;
    title: TABLE_ROW_FORMAT;
    classification: TABLE_ROW_FORMAT;
    created_by: TABLE_ROW_FORMAT;
    date_created: TABLE_ROW_FORMAT;
    feed_url: TABLE_ROW_FORMAT;
    description: TABLE_ROW_FORMAT;
    business_name: TABLE_ROW_FORMAT;
    embeddedScript?: TABLE_ROW_FORMAT;

    constructor(
        id: TABLE_ROW_FORMAT,
        feed_id: TABLE_ROW_FORMAT,
        index: TABLE_ROW_FORMAT,
        title: TABLE_ROW_FORMAT,
        business_name: TABLE_ROW_FORMAT,
        classification: TABLE_ROW_FORMAT,
        created_by: TABLE_ROW_FORMAT,
        date_created: TABLE_ROW_FORMAT,
        feed_url: TABLE_ROW_FORMAT,
        description: TABLE_ROW_FORMAT,
        embeddedScript?: TABLE_ROW_FORMAT,
    ) {
        this.id = id;
        this.feed_id = feed_id;
        this.index = index;
        this.title = title;
        this.business_name = business_name;
        this.classification = classification;
        this.created_by = created_by;
        this.date_created = date_created;
        this.feed_url = feed_url;
        this.description = description;
        this.embeddedScript = embeddedScript;
    }
}

export class UI_TABLE_FEED_DEALER implements BaseTableFeed {
    id: TABLE_ROW_FORMAT;
    feed_id: TABLE_ROW_FORMAT;
    index: TABLE_ROW_FORMAT;
    title: TABLE_ROW_FORMAT;
    classification: TABLE_ROW_FORMAT;
    created_by: TABLE_ROW_FORMAT;
    date_created: TABLE_ROW_FORMAT;
    feed_url: TABLE_ROW_FORMAT;
    description: TABLE_ROW_FORMAT;
    dealer_id: TABLE_ROW_FORMAT;
    embeddedScript?: TABLE_ROW_FORMAT;

    constructor(
        id: TABLE_ROW_FORMAT,
        feed_id: TABLE_ROW_FORMAT,
        index: TABLE_ROW_FORMAT,
        title: TABLE_ROW_FORMAT,
        classification: TABLE_ROW_FORMAT,
        created_by: TABLE_ROW_FORMAT,
        date_created: TABLE_ROW_FORMAT,
        feed_url: TABLE_ROW_FORMAT,
        description: TABLE_ROW_FORMAT,
        dealer_id: TABLE_ROW_FORMAT,
        embeddedScript?: TABLE_ROW_FORMAT,
    ) {
        this.id = id;
        this.feed_id = feed_id;
        this.index = index;
        this.title = title;
        this.classification = classification;
        this.created_by = created_by;
        this.date_created = date_created;
        this.feed_url = feed_url;
        this.description = description;
        this.embeddedScript = embeddedScript;
        this.dealer_id = dealer_id;
    }
}
