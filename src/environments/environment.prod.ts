import { API_ENDPOINTS } from './api-endpoints';

export const environment = {
	production: true,
	base_uri: window["env"]["apiUrl"],
	base_uri_old: window["env"]["apiUrlV1"],
	socket_server: window["env"]["socketUrl"],
	google_key: 'AIzaSyCtQeUg0lbyHkv-NwmlOKuR0AVYFOJ1VWY',
	s3: 'https://n-compass-filestack.s3.amazonaws.com/',
	auth: API_ENDPOINTS.auth,
	getters: API_ENDPOINTS.getters,
	create: API_ENDPOINTS.create,
	third_party: API_ENDPOINTS.third_party,
	update: API_ENDPOINTS.update,
	delete: API_ENDPOINTS.delete
};