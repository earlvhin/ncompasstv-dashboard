export interface BaseApiResponse {
    status: 'success' | 'error';
    message: string;
    data: any;
}
