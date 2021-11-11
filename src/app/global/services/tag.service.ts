import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseService } from './base.service';
import { API_FILTERS, PAGING, TAG, TAG_OWNER } from 'src/app/global/models';

@Injectable({
	providedIn: 'root'
})
export class TagService extends BaseService {

	onClickTagName = new EventEmitter<{ tagId: string }>();
	onRefreshTagsCount = new EventEmitter<void>();
	onRefreshTagsTable = new EventEmitter<void>();
	onRefreshTagOwnersTable = new EventEmitter<void>();
	onSearch = new EventEmitter<string>();

	assignTags(owners: { ownerId: string, tagTypeId: string }[], tagIds: string[]) {   
		const body = { owners, tagIds };
		return this.postRequest(this.creators.tag_owners, body);
	}
	
	createTag(data: { name: string, tagColor: string }[]) {
		const body = { names: data };
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

	getAllTags(filters: API_FILTERS): Observable<{ tags?: TAG[], paging?: PAGING, message?: string }> {
		const params = this.setUrlParams(filters)
		const url = `${this.getters.tags_get_all}${params}`;
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

	searchAllTags(keyword = '', page = 1, pageSize = 10000): Observable<{ tags?: TAG[], paging?: PAGING, message?: string }> {
		let url = `${this.getters.search_tags}?page=${page}&key=${keyword}&pageSize=${pageSize}`;
		return this.getRequest(url);
	}

	searchOwners(key: string = null): Observable<{ owners: { displayName: string, ownerId: string, tagTypeId: string, tagTypeName: string }[] }> {
		let url = `${this.getters.search_owners}`;
		if (key) url += `?key=${key}`;
		return this.getRequest(url);
	}

	searchOwnersByTagType(keyword = null, tagId: string = null, typeId = null, page = 1): Observable<{ tags?: TAG_OWNER[], paging?: PAGING, message?: string }> {
		let url = `${this.getters.search_owner_tags}?page=${page}`;

		const params = [
			{ name: 'search', value: keyword },
			{ name: 'typeId', value: typeId },
			{ name: 'tagId', value: tagId },
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

	updateTag(tagId: string, name: string, tagColor: string) {
		const body = [{ tagId, name, tagColor }];
		return this.postRequest(this.updaters.tag, body);
	}

	updateTagType(tagTypeId: number, name: string) {
		const body = { tagTypeId, name };
		return this.postRequest(this.updaters.tag_type, body);
	}

}
