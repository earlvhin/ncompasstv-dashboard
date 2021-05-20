import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-sub-dealer',
	templateUrl: './sub-dealer.component.html',
	styleUrls: ['./sub-dealer.component.scss']
})
export class SubDealerComponent implements OnInit {

	toggle: boolean;
	
	constructor() { }
	
	ngOnInit() {
	}

	receiveToggle($event) {
		this.toggle = $event
  	}
	
}
