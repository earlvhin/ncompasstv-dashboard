import { Component, OnInit, Input } from '@angular/core';
import { UI_CURRENT_USER } from 'src/app/global/models';

@Component({
  selector: 'app-activity-tab',
  templateUrl: './activity-tab.component.html',
  styleUrls: ['./activity-tab.component.scss']
})
export class ActivityTabComponent implements OnInit {
  @Input() currentRole: string;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() hostId: string;

  constructor() { }

  ngOnInit() {
  }

}
