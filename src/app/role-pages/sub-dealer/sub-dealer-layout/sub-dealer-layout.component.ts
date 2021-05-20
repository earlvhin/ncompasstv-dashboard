import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sub-dealer-layout',
  templateUrl: './sub-dealer-layout.component.html',
  styleUrls: ['./sub-dealer-layout.component.scss']
})
export class SubDealerLayoutComponent implements OnInit {

    public toggle: boolean;
	receiveToggle($event) {
		this.toggle = $event
	}

	constructor() { }

	ngOnInit() {
	}

}
