import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';

@Component({
    selector: 'app-directory',
    templateUrl: './directory.component.html',
    styleUrls: ['./directory.component.scss'],
})
export class DirectoryComponent implements OnInit {
    directory_data: any;
    filtered_data: any;
    initial_load: boolean = true;
    no_dealer_hosts: boolean = false;
    paging_data: any;
    panelOpenState = false;
    search_data: string = '';
    search_field: string = '';
    searching: boolean = false;
    subscription: Subscription = new Subscription();
    title: string = 'Directory';

    constructor(private _dealer: DealerService) {}

    ngOnInit() {
        this.getDirectoryTree(1);
    }

    getDirectoryTree(e) {
        this.searching = true;
        this.directory_data = [];
        this.subscription.add(
            this._dealer.get_dealers_directory(e, this.search_data, this.search_field).subscribe((data) => {
                this.initial_load = false;
                if (data.dealerHosts) {
                    data.dealerHosts.map((data) => {
                        if (data.hosts.length > 0) {
                            data.hosts.map((host) => {
                                host.storeHours = JSON.parse(host.storeHours);
                            });
                        }
                    });
                    this.directory_data = data.dealerHosts;
                    this.filtered_data = data.dealerHosts;
                } else {
                    this.no_dealer_hosts = true;
                    this.filtered_data = [];
                }
                this.directory_data = data.dealerHosts;
                this.paging_data = data.paging;
                this.searching = false;
            }),
        );
    }

    getPage(e) {
        this.getDirectoryTree(e);
    }

    filterData(key, searchKey) {
        if (key) {
            this.search_data = key;
            this.search_field = searchKey;
            this.getDirectoryTree(1);
        } else {
            this.search_data = '';
            this.getDirectoryTree(1);
        }
    }
}
