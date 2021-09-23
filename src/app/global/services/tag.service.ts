import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseService } from './base.service';
import { TAG } from '../models/tag.model';
import { PAGING, TAG_OWNER } from '../models';

@Injectable({
	providedIn: 'root'
})
export class TagService extends BaseService {

	onRefreshTagsTable = new EventEmitter<void>();
	onRefreshTagOwnersTable = new EventEmitter<void>();
	
	createTag(tagTypeId: number, tagColor: string, names: { name: string, tagColor: string }[], owners: string[]) {
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

	deleteTagByIdAndOwner(tagId: string, ownerId: string) {
		const url = `${this.deleters.tag_by_id_and_owner}?tagId=${tagId}&ownerId=${ownerId}`;
		return this.postRequest(url, {});
	}

	getAllTags(page = 1): Observable<{ tags?: TAG[], paging?: PAGING, message?: string }> {
		const url = `${this.getters.tags_get_all}?page=${page}`;
		return this.getRequest(url);
	}

	getAllTagTypes() {
		return this.getRequest(this.getters.tag_types_get_all);
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

	getTagsByNameAndType(name: string, typeId: number): Observable<{ tags: TAG[] }> {
		return this.getRequest(`${this.getters.tags_by_tag_name_and_type}?typeId=${typeId}&name=${name}`);
	}

	getDistinctTagsByType(typeId: number) {
		return this.getRequest(`${this.getters.distinct_tags_by_tag_type}${typeId}`);
	}

	getDistinctTagsByTypeAndName(typeId: number, tagName: string) {
		return this.getRequest(`${this.getters.distinct_tags_by_type_and_name}?typeid=${typeId}&name=${tagName}`);
	}

	searchOwnersByTagType(keyword = null, typeId = null, page = 1): Observable<{ tags?: TAG_OWNER[], paging?: PAGING, message?: string }> {
		let url = `${this.getters.search_owner_tags}?page=${page}`;

		const params = [
			{ name: 'search', value: keyword },
			{ name: 'typeId', value: typeId },
		];

		params.forEach(
			param => {

				if (param.value) {
					if (url.includes('?')) url += '&';
					else url += '?';
					url += `${param.name}=${param.value}`;
				}

			}
		);
		
		return this.getRequest(url);
	}

	searchAllTags(keyword = '', typeId = 0, page = 1): Observable<{ tags?: TAG[], paging?: PAGING, message?: string }> {
		let url = `${this.getters.search_tags}?page=${page}&key=${keyword}`;
		if (typeId && typeId > 0) url += `$typeId=${typeId}`;
		return this.getRequest(url);
	}

	updateTag(tagId: number, name: string, tagColor: string) {
		const body = [{ tagId, name, tagColor }];
		return this.postRequest(this.updaters.tag, body);
	}

	updateTagType(tagTypeId: number, name: string) {
		const body = { tagTypeId, name };
		return this.postRequest(this.updaters.tag_type, body);
	}

}
