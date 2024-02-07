import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UI_ROLE_DEFINITION_TEXT, UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';

@Component({
    selector: 'app-create-user-type',
    templateUrl: './create-user-type.component.html',
    styleUrls: ['./create-user-type.component.scss'],
})
export class CreateUserTypeComponent implements OnInit {
    user_type: string;
    subscription: Subscription = new Subscription();
    current_role: string;

    constructor(private _params: ActivatedRoute) {}

    ngOnInit() {
        this.subscription.add(
            this._params.paramMap.subscribe(() => {
                this.user_type = this._params.snapshot.params.data;

                switch (UI_ROLE_DEFINITION[this.user_type]) {
                    case UI_ROLE_DEFINITION.administrator:
                        this.current_role = UI_ROLE_DEFINITION_TEXT.administrator;
                        break;
                    case UI_ROLE_DEFINITION.dealeradmin:
                        this.current_role = UI_ROLE_DEFINITION_TEXT.dealeradmin;
                        break;
                    case UI_ROLE_DEFINITION.tech:
                        this.current_role = UI_ROLE_DEFINITION_TEXT.tech;
                        break;
                    case UI_ROLE_DEFINITION.dealer:
                        this.current_role = UI_ROLE_DEFINITION_TEXT.dealer;
                        break;
                    case UI_ROLE_DEFINITION.host:
                        this.current_role = UI_ROLE_DEFINITION_TEXT.host;
                        break;
                    case UI_ROLE_DEFINITION.advertiser:
                        this.current_role = UI_ROLE_DEFINITION_TEXT.advertiser;
                        break;
                    case UI_ROLE_DEFINITION['sub-dealer']:
                        this.current_role = UI_ROLE_DEFINITION_TEXT['sub-dealer'];
                        break;
                }
            }),
        );
    }

    get userRole() {
        return UI_ROLE_DEFINITION_TEXT;
    }
}
