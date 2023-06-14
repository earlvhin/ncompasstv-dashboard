import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AddFillerGroupComponent } from './components/add-filler-group/add-filler-group.component';
import { EditFillerGroupComponent } from './components/edit-filler-group/edit-filler-group.component';

@Component({
	selector: 'app-fillers',
	templateUrl: './fillers.component.html',
	styleUrls: ['./fillers.component.scss']
})
export class FillersComponent implements OnInit {
	title = 'Fillers Library';

	constructor(private _dialog: MatDialog) {}

	ngOnInit() {}

	onTabChanged(e: { index: number }) {
		switch (e.index) {
			case 1:
				// this.pageRequested(1);
				break;
			case 0:
				// this.getLicenses(1);
				break;
			case 3:
				// this.getHosts(1);
				break;
			default:
		}
	}

	onSearchFiller(event) {}

	onAddFillerGroup() {
		let dialog = this._dialog.open(AddFillerGroupComponent, {
			width: '500px',
			data: {
				// dealer: this.selected_dealer,
				// singleSelect: true
			}
		});
	}

	onEditFillerGroup() {
		let dialog = this._dialog.open(EditFillerGroupComponent, {
			width: '500px',
			data: {
				// dealer: this.selected_dealer,
				// singleSelect: true
			}
		});
	}
}
