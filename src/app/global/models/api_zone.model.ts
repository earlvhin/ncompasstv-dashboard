export class API_ZONE {
    templateZoneId: string;
    templateId: string;
    name: string;
    description: string;
    xPos: number;
    yPos: number;
    height: number;
    width: number;
    background: string;
    order: number;

    constructor(
        t_name: string,
        t_xpos: number,
        t_ypos: number,
        t_height: number,
        t_width: number,
        t_background: string,
        t_order: number,
    ) {
        this.name = t_name;
        this.xPos = t_xpos;
        this.yPos = t_ypos;
        this.height = t_height;
        this.width = t_width;
        this.background = t_background;
        this.order = t_order;
    }
}
