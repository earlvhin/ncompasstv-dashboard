export interface Paging {
	totalCount: number;
	pageSize: number;
	currentPage: number;
}

export interface CityData {
	id: number;
	city: string;
	abbreviation: string;
	state: string;
	region: string;
	country: string;
	fullSearch: string;
}

export interface CITIES_STATE {
	paging: Paging;
	data: CityData[];
}
