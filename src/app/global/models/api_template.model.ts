import { API_ZONE } from './api_zone.model';

export class API_TEMPLATE {
    template: {
        templateId: string;
        name: string;
    };
    templateZones: API_ZONE[];

    constructor(template_id: string, template_name: string, template_zones: API_ZONE[]) {
        this.template.templateId = template_id;
        this.template.name = template_name;
        this.templateZones = template_zones;
    }
}
