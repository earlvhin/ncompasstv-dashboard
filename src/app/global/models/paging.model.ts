export type PAGING = {
    entities: any[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
    pageSize: number;
    pages: number;
    role?: number;
    totalEntities: number;
    pageStart: number;
};
