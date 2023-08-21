import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { BaseService } from './base.service';
import { CREATE_AND_ASSIGN_TAG, API_FILTERS, OWNER, PAGING, TAG, TAG_OWNER } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Injectable({
	providedIn: 'root'
})
export class TagService extends BaseService {
	onClickTagName = new Subject<{ tag: TAG; tab: string }>();
	onRefreshTagsCount = new Subject<void>();
	onRefreshTagsTable = new Subject<void>();
	onRefreshTagOwnersTable = new Subject<void>();
	onSearch = new Subject<string>();

	constructor(_auth: AuthService, _http: HttpClient) {
		super(_auth, _http);
	}

	assignTags(owners: { ownerId: string; tagTypeId: string }[], tagIds: string[], isDealer) {
		const body = { owners, tagIds };
		return this.postRequest(this.creators.tag_owners, body);
	}

	checkTagName(name: string) {
		const endpoint = `${this.getters.tag_check_name}?name=${name}`;
		return this.postRequest(endpoint, {});
	}

	createAndAssignTags(body: CREATE_AND_ASSIGN_TAG, isDealer?): Observable<{ message: string; tags: any }> {
		if (isDealer) {
			let url_split = this.creators.tag_add_and_assign.split('/');
			let new_endpoint = url_split[0] + '/dealer/' + url_split[2] + '/' + url_split[3];
			return this.postRequest(new_endpoint, body);
		} else {
			const endpoint = this.creators.tag_add_and_assign;
			return this.postRequest(endpoint, body);
		}
	}

	createTag(data: { role: number; name: string; tagColor: string; createdBy: string; description?: string; exclude?: number }) {
		const { exclude, createdBy, name, tagColor, description, role } = data;
		let url_split = this.creators.admin_tag.split('/');
		const endpoint = role === 1 ? this.creators.admin_tag : role === 2 ? this.creators.dealer_tag : url_split[0] + '/' + url_split[2];
		const body = { exclude, createdBy, names: [{ name, tagColor, description }] };
		return this.postRequest(endpoint, body);
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

	getAllTags(filters: API_FILTERS, isDealer) {
		const params = this.setUrlParams(filters);
		const url = `${this.getters.tags_get_all}${params}`;
		let url_split = this.getters.tags_get_all.split('/');
		let new_url = url_split[0] + '/dealer/' + url_split[1];
		new_url = `${new_url}${params}`;
		return this.getRequest(isDealer ? new_url : url);
	}

	getAllOwnerAndTags({ keyword = null, page = 1, role = 1, pageSize = null }, isDealer): Observable<{ tags?: TAG_OWNER[]; paging?: PAGING }> {
		let url_split = this.getters.search_owner_tags.split('/');
		let new_url = url_split[0] + '/dealer/' + url_split[1];
		let final_url = !isDealer ? this.getters.search_owner_tags : new_url;
		let url = `${final_url}?page=${page}&role=${role}&pageSize=${pageSize}`;

		const params = [{ name: 'search', value: keyword }];

		params.forEach((param) => {
			if (param.value) {
				if (url.includes('?')) url += '&';
				else url += '?';
				url += `${param.name}=${encodeURIComponent(param.value)}`;
			}
		});

		return this.getRequest(url);
	}

	getAllTagTypes() {
		return this.getRequest(this.getters.tag_types_get_all);
	}

	getAllTagsCount(isDealer?) {
		let url_split = this.getters.tags_count.split('/');
		let new_url = url_split[0] + '/dealer/' + url_split[1];
		return this.getRequest(!isDealer ? this.getters.tags_count : new_url);
	}

	getTag(tagId: number) {
		return this.getRequest(`${this.getters.tags_by_id}${tagId}`);
	}

	getTagByOwner(ownerId: string): Observable<{ tags: TAG[] }> {
		return this.getRequest(`${this.getters.tags_by_owner_id}=${ownerId}`);
	}

	getTagsByRole(role = 0): Observable<{ paging?: PAGING; tags?: TAG[] }> {
		const url = `${this.getters.tags_by_role}?role=${role}`;
		return this.getRequest(url);
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

	searchAllTags({ keyword = '', page = 1, role = 1, pageSize = 20 }, isDealer?): Observable<{ tags?: TAG[]; paging?: PAGING; message?: string }> {
		let url_split = this.getters.search_tags.split('/');
		let new_url = url_split[0] + '/dealer/' + url_split[1];
		let final_url = !isDealer ? this.getters.search_tags : new_url;
		let url = `${final_url}?page=${page}&pageSize=${pageSize}&role=${role}`;

		if (keyword.length > 0) url += `&key=${encodeURIComponent(keyword)}`;

		return this.getRequest(url);
	}

	searchOwners(key: string = null, isDealer) {
		let url = `${this.getters.search_owners}`;
		let url_split = this.getters.search_owners.split('/');
		let new_url = url_split[0] + '/dealer/' + url_split[1];
		if (key) isDealer ? (new_url += `?key=${key}`) : (url += `?key=${key}`);
		return this.getRequest(isDealer ? new_url : url);
	}

	searchOwnersByTagType(
		{ keyword = null, tagId = null, typeId = null, page = 1, role = 1 },
		isDealer
	): Observable<{ tags?: TAG_OWNER[]; paging?: PAGING; message?: string }> {
		let url_split = this.getters.search_owner_tags.split('/');
		let new_url = url_split[0] + '/dealer/' + url_split[1];
		let final_url = !isDealer ? this.getters.search_owner_tags : new_url;
		let url = `${final_url}?page=${page}&role=${role}`;

		const params = [
			{ name: 'search', value: keyword },
			{ name: 'typeId', value: typeId },
			{ name: 'tagId', value: tagId }
		];

		params.forEach((param) => {
			if (param.value) {
				if (url.includes('?')) url += '&';
				else url += '?';
				url += `${param.name}=${encodeURIComponent(param.value)}`;
			}
		});

		return this.getRequest(url);
	}

	searchDealerData(
		{ keyword = null, tagId = null, typeId = null, page = 1, role = 1 },
		isDealer
	): Observable<{ tags?: TAG_OWNER[]; paging?: PAGING; message?: string }> {
		const url_split = this.getters.search_dealer_data.split('/');
		const new_url = url_split[0] + '/dealer/' + url_split[1];
		const final_url = !isDealer ? this.getters.search_dealer_data : new_url;
		let url = `${final_url}?page=${page}&role=${role}`;

		const params = [
			{ name: 'search', value: keyword },
			{ name: 'typeId', value: typeId },
			{ name: 'tagId', value: tagId }
		];

		params.forEach((param) => {
			if (param.value) {
				if (url.includes('?')) url += '&';
				else url += '?';
				url += `${param.name}=${encodeURIComponent(param.value)}`;
			}
		});

		return this.getRequest(url);
	}

	updateTag(
		tagId: string,
		name: string,
		tagColor: string,
		updatedBy: string,
		description?: string,
		exclude = 0
	): Observable<{ message: string; tag?: TAG[] }> {
		const body: TAG = {
			tagId,
			name,
			tagColor,
			updatedBy,
			exclude,
			description
		};

		if (description) body.description = description;
		return this.postRequest(this.updaters.tag, [body]);
	}

	updateTagType(tagTypeId: number, name: string) {
		const body = { tagTypeId, name };
		return this.postRequest(this.updaters.tag_type, body);
	}
}
