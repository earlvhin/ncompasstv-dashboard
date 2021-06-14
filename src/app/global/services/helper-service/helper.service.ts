import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})

export class HelperService {

    onResetAutocompleteField = new EventEmitter<string>();
	onClickAllDealers = new EventEmitter<void>();
	onClickActiveDealers = new EventEmitter<void>();
	onClickInactiveDealers = new EventEmitter<void>();

}