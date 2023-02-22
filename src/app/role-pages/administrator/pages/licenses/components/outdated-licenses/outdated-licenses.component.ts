import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { API_PLAYER_APP } from 'src/app/global/models';

import { UpdateService } from 'src/app/global/services';

@Component({
	selector: 'app-outdated-licenses',
	templateUrl: './outdated-licenses.component.html',
	styleUrls: ['./outdated-licenses.component.scss']
})
export class OutdatedLicensesComponent implements OnInit, OnDestroy {
	protected _unsubscribe = new Subject<void>();

	constructor(private _update: UpdateService) {}

	ngOnInit() {
		this.getPlayerAppIds();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private getOutdatedLicenses() {}

	private getPlayerAppIds() {
		this._update
			.get_apps()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					const playerServer: API_PLAYER_APP = response.filter((app) => app.appName.toLowerCase() === 'player server')[0];
					const playerUi: API_PLAYER_APP = response.filter((app) => app.appName.toLowerCase() === 'player ui')[0];

					const requests = [this._update.get_app_version(playerServer.appId), this._update.get_app_version(playerUi.appId)];

					forkJoin(requests)
						.pipe(takeUntil(this._unsubscribe))
						.subscribe(
							([response1, response2]) => {
								console.log('response1', response1);
								console.log('response2', response2);
							},
							(error) => {
								throw new Error(error);
							}
						);

					// this._update.get_app_version().pipe(takeUntil(this._unsubscribe))
					//     .subscribe(
					//         response => {

					//         },
					//         error => {
					//             throw new Error(error)
					//         }
					//     );
				},
				(error) => {
					throw new Error(error);
				}
			);
	}
}
