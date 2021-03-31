import { Routes } from '@angular/router';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { UI_ROLE_DEFINITION } from '../../global/models/ui_role-definition.model';
import { HostLayoutComponent } from './host-layout/host-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UserProfileComponent } from '../../global/pages_shared/user-profile/user-profile.component';
import { UserAccountSettingComponent } from '../../global/pages_shared/user-account-setting/user-account-setting.component';

export const HOST_ROUTES: Routes = [
    {
        path: 'host',
        component: HostLayoutComponent,
        canActivate: [AuthGuard],
        data: { role: [UI_ROLE_DEFINITION.host] },
        children: [
            { path: '', component: DashboardComponent },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'user-profile/:data', component: UserProfileComponent },
            { path: 'user-account-setting/:data', component: UserAccountSettingComponent }
        ]
    }
];
