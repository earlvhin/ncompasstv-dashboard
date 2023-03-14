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
	id: string | number;
	open: string;
	openingHourData?: { hour: number; minute: number; second?: number };
	closingHourData?: { hour: number; minute: number; second?: number };
	day?: string; // used to pass the day name for checking
}
