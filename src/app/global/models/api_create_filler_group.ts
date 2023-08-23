export class API_CREATE_FILLER_GROUP {
	name: string;
	paired: number;

	constructor(name: string, paired: number) {
		this.name = name;
		this.paired = paired;
	}
}
