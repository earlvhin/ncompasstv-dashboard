import { API_ENDPOINTS } from './api-endpoints';

export const environment = {
	production: false,
	base_uri: 'http://3.212.225.229:82/api/',
	base_uri_old: 'http://3.212.225.229:82/api/',
	socket_server: 'http://3.212.225.229:83',
	google_key: 'AIzaSyCtQeUg0lbyHkv-NwmlOKuR0AVYFOJ1VWY',
	s3: 'https://n-compass-filestack.s3.amazonaws.com/',
	auth: API_ENDPOINTS.auth,
	getters: API_ENDPOINTS.getters,
	create: API_ENDPOINTS.create,
	third_party: API_ENDPOINTS.third_party,
	update: API_ENDPOINTS.update,
	delete: API_ENDPOINTS.delete
};