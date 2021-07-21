import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseService } from './base.service';
import { Tag } from '../models/tag.model';

@Injectable({
	providedIn: 'root'
})
export class TagService extends BaseService {

	createTag(tagTypeId: number, tagColor: string, names: string[], owners: string[]) {
		const body = { tagTypeId, owners, names, tagColor };
		return this.postRequest(this.creators.tag, body);
	}

	createTagType(name: string) {
		const body = { name };
		return this.postRequest(this.creators.tag_type, body);
	}

	deleteAllTagsFromOwner(id: string) {
		const body = {};
		return this.postRequest(`${this.deleters.tag_by_owner_id}${id}`, body);
	}

	deleteTag(ids: string[]) {
		const body = { owners: ids }; 
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

	getTagsByNameAndType(name: string, typeId: number): Observable<{ tags: Tag[] }> {
		return this.getRequest(`${this.getters.tags_by_tag_name_and_type}?typeId=${typeId}&name=${name}`);
	}

	getDistinctTagsByType(typeId: number) {
		return this.getRequest(`${this.getters.distinct_tags_by_tag_type}${typeId}`);
	}

	getDistinctTagsByTypeAndName(typeId: number, tagName: string) {
		return this.getRequest(`${this.getters.distinct_tags_by_type_and_name}?typeid=${typeId}&name=${tagName}`);
	}

	searchOwnersByTagType(typeId: number, keyword = '') {
		return this.getRequest(`${this.getters.search_tags}?typeid=${typeId}&search=${keyword}`)
			.map((response: { tags: { owner: any, tagTypeId: string, tags: any[] }[] }) => response.tags);
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
