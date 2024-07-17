import { API_ENDPOINTS } from './api-endpoints';

export const environment = {
    production: false,
    base_uri: 'https://dev-api.n-compass.online:8009/api/',
    socket_server: 'https://dev-socket.n-compass.online',
    google_key: 'AIzaSyCtQeUg0lbyHkv-NwmlOKuR0AVYFOJ1VWY',
    tinymce_key: 'abs5vx4ocdaeymfu6a4m3vg4jjz3rkqcra1v48azbvttca7l',
    timezone_key: 'VDREUWGAR8QT',
    s3: 'https://n-compass-filestack.s3.amazonaws.com/',
    s3_ncompass_files: 'https://n-compass-files.s3.amazonaws.com/',
    fastedge: 'https://fastedgeapidev.n-compass.online/nc/googleapi/searchplaces?place=',
    auth: API_ENDPOINTS.auth,
    getters: API_ENDPOINTS.getters,
    create: API_ENDPOINTS.create,
    third_party: API_ENDPOINTS.third_party,
    update: API_ENDPOINTS.update,
    delete: API_ENDPOINTS.delete,
    upsert: API_ENDPOINTS.upsert,
};
