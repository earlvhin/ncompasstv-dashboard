import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
    selector: 'app-locator',
    templateUrl: './locator.component.html',
    styleUrls: ['./locator.component.scss'],
})
export class LocatorComponent implements OnInit {
    title = 'Locator';
    is_admin = false;
    is_dealer = false;

    constructor(private _auth: AuthService) {}

    ngOnInit() {
        this.setRole();
    }

    protected setRole(): void {
        const currentRole = this._auth.current_role;

        switch (currentRole) {
            case 'administrator':
                this.is_admin = true;
                break;

            case 'dealer':
            case 'sub-dealer':
                this.is_dealer = true;
                break;
        }
    }
}
