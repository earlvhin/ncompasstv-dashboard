import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
	selector: 'app-clone-feed-dialog',
	templateUrl: './clone-feed-dialog.component.html',
	styleUrls: ['./clone-feed-dialog.component.scss']
})
export class CloneFeedDialogComponent implements OnInit {

	feedName = new FormControl();
	
	constructor() { }
	
	ngOnInit() {
	}
	
}
