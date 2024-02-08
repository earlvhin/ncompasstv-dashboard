import { Component, OnInit } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { UI_ROLE_DEFINITION_TEXT, UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
    selector: 'app-create-user',
    templateUrl: './create-user.component.html',
    styleUrls: ['./create-user.component.scss'],
})
export class CreateUserComponent implements OnInit {
    constructor(private _auth: AuthService) {}

    isLinear = false;
    role: number = 0;
    is_dealer: boolean = false;
    is_dealer_admin: boolean = false;

    user_type = [];

    ngOnInit() {
        if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            this.is_dealer_admin = true;
        }
        const roleId = this._auth.current_user_value.role_id;
        const dealerRole = UI_ROLE_DEFINITION.dealer;
        const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

        if (roleId === dealerRole || roleId === subDealerRole) {
            this.is_dealer = true;
        }

        this.user_type = [
            {
                role_name: 'Administrator',
                role_description: 'Access to all data and grant all privilege.',
                role_icon: 'assets/media-files/admin-icon.png',
                role: UI_ROLE_DEFINITION_TEXT.administrator,
                is_dealer: this.is_dealer,
            },
            {
                role_name: 'Dealer Admin',
                role_description: 'Access to all data and grant all privilege under certain dealers.',
                role_icon: 'assets/media-files/admin-icon.png',
                role: UI_ROLE_DEFINITION_TEXT.dealeradmin,
                is_dealer: this.is_dealer,
            },
            {
                role_name: 'Tech Officer',
                role_description: 'Access to all data and grant all privilege except billing.',
                role_icon: 'assets/media-files/tech-icon.png',
                role: UI_ROLE_DEFINITION_TEXT.tech,
                is_dealer: this.is_dealer,
            },
            {
                role_name: 'Dealer',
                role_description: 'View and edit access to their Hosts and Advertisers data.',
                role_icon: 'assets/media-files/dealer-icon.png',
                role: UI_ROLE_DEFINITION_TEXT.dealer,
                is_dealer: this.is_dealer,
                is_dealer_admin: this.is_dealer_admin,
            },
            {
                role_name: 'Sub-Dealer',
                role_description: 'Dealer account with access to only a max of 5 sub accounts',
                role_icon: 'assets/media-files/dealer-icon.png',
                role: UI_ROLE_DEFINITION_TEXT['sub-dealer'],
                is_dealer_admin: this.is_dealer_admin,
            },
            {
                role_name: 'Host',
                role_description: 'View access to data of Ads played in their workplace.',
                role_icon: 'assets/media-files/host-icon.png',
                role: UI_ROLE_DEFINITION_TEXT.host,
                is_dealer_admin: this.is_dealer_admin,
            },
            {
                role_name: 'Advertiser',
                role_description: 'View access to their advertising content',
                role_icon: 'assets/media-files/advertiser-icon.png',
                role: UI_ROLE_DEFINITION_TEXT.advertiser,
                is_dealer_admin: this.is_dealer_admin,
            },
        ];
    }

    formPerRole(role) {
        this.role = role;
    }

    stepperFinished(stepper: MatStepper) {
        stepper.next();
    }
}
