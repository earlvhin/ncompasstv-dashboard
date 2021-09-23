export type PAGING = {
	entities: any[];
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	page: number;
	pageSize: number;
	pages: number;
	totalEntities: number;
	pageStart: number;
}