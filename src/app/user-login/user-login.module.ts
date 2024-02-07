import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './pages/login/login.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { LoginLayoutComponent } from './login-layout/login-layout.component';
import { LOGIN_ROUTES } from './login.routes';

// Material Theme Modules
import {
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
} from '@angular/material';

const MaterialModule = [
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
];
@NgModule({
    declarations: [LoginComponent, LoginFormComponent, LoginLayoutComponent],
    imports: [
        CommonModule,
        MaterialModule,
        MatInputModule,
        MatCardModule,
        MatButtonModule,
        ReactiveFormsModule,
        RouterModule.forChild(LOGIN_ROUTES),
    ],
})
export class UserLoginModule {}
