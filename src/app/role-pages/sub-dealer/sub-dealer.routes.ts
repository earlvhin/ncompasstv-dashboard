import { Routes } from '@angular/router';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { UI_ROLE_DEFINITION } from '../../global/models/ui_role-definition.model';
import { UserProfileComponent } from '../../global/pages_shared/user-profile/user-profile.component';
import { UserAccountSettingComponent } from '../../global/pages_shared/user-account-setting/user-account-setting.component';
import { SubDealerComponent } from './sub-dealer.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const SUB_DEALER_ROUTES: Routes = [
    {
        path: 'sub-dealer',
        component: SubDealerComponent,
        canActivate: [ AuthGuard ],
        data: { role: [ UI_ROLE_DEFINITION['sub-dealer']]  },
        children: [
            { path: '', component: DashboardComponent },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'user-profile/:data', component: UserProfileComponent },
            { path: 'user-account-setting/:data', component: UserAccountSettingComponent }
        ]
    }
];
