import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})

export class HelperService {

    onResetAutocompleteField = new EventEmitter<string>();

}