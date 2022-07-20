export interface UI_STORE_HOUR {
	day: string;
	id: number;
	label: string;
	periods: UI_STORE_HOUR_PERIOD[];
	status: boolean;
}

export interface UI_STORE_HOUR_PERIOD {
	close: string;
	day_id: number;
	id: string;
	open: string;
}