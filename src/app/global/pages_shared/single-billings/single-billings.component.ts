import {
    Component,
    OnInit,
    Input,
    ChangeDetectorRef,
    EventEmitter,
    Output,
    ChangeDetectionStrategy,
} from '@angular/core';
import { AuthService } from 'src/app/global/services';

import { UI_ROLE_DEFINITION } from 'src/app/global/models';
@Component({
    selector: 'app-single-billings',
    templateUrl: './single-billings.component.html',
    styleUrls: ['./single-billings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleBillingsComponent implements OnInit {
    @Input() dealer: string;
    @Input() reload: boolean = true;
    current_tab: string = 'Dealer';
    isdealer: boolean = false;

    ngOnInit(): void {
        if (this._isDealer || this._isSubDealer) {
            this.isdealer = true;
        }
    }

    constructor(
        private cdr: ChangeDetectorRef,
        private _auth: AuthService,
    ) {}

    ngOnChanges() {
        if (this.reload) {
            this.cdr.detectChanges();
        }
    }

    public get _isDealer() {
        return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer;
    }

    public get _isSubDealer() {
        return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'];
    }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }

    tabSelected(event: { index: number }): void {
        switch (event.index) {
            case 0:
                this.current_tab = 'Dealer';
                break;
            case 1:
                this.current_tab = 'Bills';
                break;
            default:
        }
    }
}
