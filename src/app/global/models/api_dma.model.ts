export interface API_DMA {
	dmaCode: string;
	dmaName: string;
	dmaRank: number;
	totalHosts: number;
	hosts?: API_DMA_HOST[];
}

export interface API_DMA_HOST {
	country: string;
	dmaCode: string;
	dmaName: string;
	dmaRank: number;
	hostId: string;
	hostName: string;
	latitude: string;
	longitude: string;
	zip: string;
}
