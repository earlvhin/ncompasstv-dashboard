import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseService } from './base.service';
import { Tag } from '../models/tag.model';

@Injectable({
	providedIn: 'root'
})
export class TagService extends BaseService {

	createTag(tagTypeId: number, ownerId: string, name: string) {
		const body = { tagTypeId, ownerId, name };
		return this.postRequest(this.creators.tag, body);
	}

	createTagType(name: string) {
		const body = { name };
		return this.postRequest(this.creators.tag_type, body);
	}

	deleteTag(body: string[]) {
		return this.postRequest(this.deleters.tag, body);
	}

	getAllTagTypes() {
		return this.getRequest(this.getters.all_tag_types);
	}

	getAllTagsCount() {
		return this.getRequest(this.getters.tags_count);
	}

	getTag(tagId: number) {
		return this.getRequest(`${this.getters.tags_by_id}${tagId}`);
	}

	getTagByOwner(ownerId: string) {
		return this.getRequest(`${this.getters.tags_by_owner_id}${ownerId}`);
	}

	getTagsByTagType(typeId: number) {
		return this.getRequest(`${this.getters.tag_types_by_type_id}${typeId}`);
	}

	getTagsByNameAndType(name: string, typeId: number): Observable<{ tags: Tag[] }> {
		return this.getRequest(`${this.getters.tags_by_tag_name_and_type}?typeId=${typeId}&name=${name}`);
	}

	getDistinctTagsByTypeId(typeId: number) {
		return this.getRequest(`${this.getters.distinct_tags_by_tag_type}${typeId}`);
	}

	updateTag(tagId: number, name: string) {
		const body = { tagId, name };
		return this.postRequest(this.updaters.tag, body);
	}

	updateTagType(tagTypeId: number, name: string) {
		const body = { tagTypeId, name };
		return this.postRequest(this.updaters.tag_type, body);
	}

}
