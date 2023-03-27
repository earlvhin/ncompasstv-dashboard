import { create } from 'domain';

export class UI_TABLE_FEED {
	id: object;
	feed_id: object;
	index: object;
	title: object;
	business_name: object;
	classification: object;
	created_by: object;
	date_created: object;
	feed_url: object;
	description: object;
	embeddedScript?: any;

	constructor(
		id: object,
		feed_id: object,
		index: object,
		title: object,
		business_name: object,
		classification: object,
		created_by: object,
		date_created: object,
		feed_url: object,
		description: object,
		embeddedscript?: any
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
		this.embeddedScript = embeddedscript;
	}
}

export class UI_TABLE_FEED_DEALER {
	id: object;
	feed_id: object;
	index: object;
	title: object;
	classification: object;
	created_by: object;
	date_created: object;
	feed_url: object;
	description: object;

	constructor(
		id: object,
		feed_id: object,
		index: object,
		title: object,
		classification: object,
		created_by: object,
		date_created: object,
		feed_url: object,
		description: object
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
	}
}
