/**
 * SAMPLE DATA
{
	tagTypeId: 1,
	name: "Test",
	dateCreated: "2021-04-07T03:38:49+00:00",
	status: "A"
}
 */

export interface TagType {
	tagTypeId: number;
	name: string;
	dateCreated: string;
	status: string;
}
