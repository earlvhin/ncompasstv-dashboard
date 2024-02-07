import { Component } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

export let browserRefresh = false;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    subscription;

    constructor(private router: Router) {
        this.subscription = router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                browserRefresh = !router.navigated;

                localStorage.removeItem('playlist_data');
                localStorage.removeItem('playlist_order');
                localStorage.removeItem('to_blocklist');
            }
        });
    }

    title = 'dashboard-material';
}
