import { DatePipe } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UI_CURRENT_USER, UI_HOST_ACTIVITY } from 'src/app/global/models';
import { HostService } from 'src/app/global/services';

@Component({
  selector: 'app-activity-tab',
  templateUrl: './activity-tab.component.html',
  styleUrls: ['./activity-tab.component.scss']
})
export class ActivityTabComponent implements OnInit {

  @Input() currentRole: string;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() hostId: string;

  activity_data: UI_HOST_ACTIVITY[] = []
  hostData: any;
  initial_load = true;
  paging_data: any;
  sort_column = 'DateCreated';
	sort_order = 'desc';
  no_activity_data = false;
  dateFormatted: any;

  activity_table_column = [
    {name: "#", sortable: false},
    {name: "Date Created", column: 'dateCreated', sortable: true},
    {name: "Activity", column: 'activityCode', sortable: false}

  ]

  constructor(private _date: DatePipe, private _host: HostService) { }
  protected _unsubscribe: Subject<void> = new Subject<void>();

  ngOnInit() {
    this.getHost();
    this.reloadTable();
    this.getActivity(1);

  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getColumnsAndOrder(data: { column: string; order: string }) : void {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getActivity(1);
	}
  

  getActivity(page: number): void {
    this.activity_data = [];

    this._host
    .get_host_activity(this.hostId, this.sort_column, this.sort_order, page)
    .pipe(takeUntil(this._unsubscribe))
    .subscribe((res) => {
      
        if (res.paging.entities.length === 0) {
          this.no_activity_data = true;
          this.activity_data = []
          return
        }

        const mappedData = this.mapToTableFormat(res.paging.entities)
        this.activity_data = [...mappedData]
        this.paging_data = res.paging;
    },
        (error) => {
          throw new Error(error);
        }
      )
      .add(() => this.initial_load = false)
  }

  getHost(){
    this._host.get_host_by_id(this.hostId)
    .pipe(takeUntil(this._unsubscribe))
    .subscribe((res) => {
        this.hostData = res;
        this.dateFormatted = this._date.transform(res.host.dateCreated, "MMMM d, y" );
    });
  }

  reloadTable(){
    this._host.dialogClosed$
    .pipe(takeUntil(this._unsubscribe))
    .subscribe(() => {
      this.reload_page(true);
    });
  }

  reload_page(e: boolean):void {
		if (e) this.ngOnInit();
	}


  mapToTableFormat(activity): any {
    let count = 1;

    return activity.map((a: any) => {
      const activity = a.activityCode;
      let activityMessage;

      if (activity === "assign_license") {
        activityMessage =`${this.currentUser.firstname} ${this.currentUser.lastname} assigned a license`
      } else if (activity === "unassign_license" ) {
        activityMessage =`${this.currentUser.firstname} ${this.currentUser.lastname} unassigned a license`
      } else if (activity === "modify_host" ) {
        activityMessage =`${this.currentUser.firstname} ${this.currentUser.lastname} modified the host`
      } else if (activity === "create_screen") {
        activityMessage =`${this.currentUser.firstname} ${this.currentUser.lastname} created a screen`
      } else {
       activityMessage ="hi"
      }

      return new UI_HOST_ACTIVITY(
        {value: count++, editable: false},
        {value: a.ownerId, hidden: true},
        {value: a.activityLogId, hidden: true},
        {value: this._date.transform(a.dateCreated, "MMMM d, y"), hidden: false},
        {value: activityMessage, hidden: false},
        {value: a.initiatedBy, hidden: true},
        {value: a.dateUpdated, hidden: true},
        
      )
    })
  }

}
