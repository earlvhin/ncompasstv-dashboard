import { Routes } from '@angular/router';
import { NotFoundLayoutComponent } from './not-found-layout/not-found-layout.component';
import { ErrorNotFoundComponent } from './pages/error-not-found/error-not-found.component';
import { AuthGuard } from '../global/guards/auth/auth.guard';

export const NOTFOUND_ROUTES: Routes = [
    {
        path: '404',
        component: NotFoundLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                component: ErrorNotFoundComponent,
            },
        ],
    },
];
