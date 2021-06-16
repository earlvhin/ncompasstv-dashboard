import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserSortModalComponent } from '../user-sort-modal/user-sort-modal.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
	selector: 'app-media-library-options',
	templateUrl: './media-library-options.component.html',
	styleUrls: ['./media-library-options.component.scss']
})

export class MediaLibraryOptionsComponent implements OnInit {
	
	@Input() disable_user_filter: boolean = false;
	@Input() empty_s: boolean;
	@Output() filetype = new EventEmitter;
	@Output() sortAscend = new EventEmitter;
	@Output() sortDescend = new EventEmitter;
	@Output() sortUser = new EventEmitter;
	@Output() searchKeyword = new EventEmitter;
	subscription: Subscription = new Subscription;
	search_control = new FormControl();
	search_form_invalid: boolean = false;
	constructor(
		private _dialog: MatDialog
	) { }

	ngOnInit() {
		this.onSearch();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	viewByFileType(e) {
		this.filetype.emit(e);
	}

	sortAscending() {
		this.sortAscend.emit(true);
	}

	sortDescending() {
		this.sortDescend.emit(true);
	}

	sortByUser() {
		let dialog = this._dialog.open(UserSortModalComponent, {
			width: '500px',
		})

		dialog.afterClosed().subscribe(
			data => {
				if (data) {
					console.log("DATA", data)
					this.sortUser.emit(data)
				}
			}
		)
	}

	onSearch() {
		this.search_control.setValidators([Validators.minLength(3)]);

		// clearTimeout(this.timeOut);
		// this.timeOut = setTimeout(() => {
		// 	if(this.search_keyword.length >= 3) {
		// 		this.searched.emit(this.search_keyword);
		// 	} else {
		// 		if(this.search_keyword.length == 0) {
		// 			this.reset_search.emit(true);
		// 		}
		// 	}
		// }, this.timeOutDuration); 

		this.subscription.add(
			this.search_control.valueChanges
			.pipe(debounceTime(1000), distinctUntilChanged())
			.subscribe(data => {
				if (this.search_control.valid) {
					this.search_form_invalid = false;
					this.searchKeyword.emit(data);
				} else {
					this.search_form_invalid = true;
				}
			})
		)
	}
}