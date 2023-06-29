import { Component, OnInit } from '@angular/core';
import { FillerService } from 'src/app/global/services';

@Component({
	selector: 'app-view-fillers-group',
	templateUrl: './view-fillers-group.component.html',
	styleUrls: ['./view-fillers-group.component.scss']
})
export class ViewFillersGroupComponent implements OnInit {
	title = 'Fillers Library';

	constructor(private _filler: FillerService) {}

	ngOnInit() {}

	openGenerateLicenseModal() {}
}
