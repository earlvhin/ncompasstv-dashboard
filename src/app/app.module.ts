import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserLoginModule } from './user-login/user-login.module';
import { NotfoundModule } from './not-found/not-found.module';
import { AdministratorModule } from './role-pages/administrator/administrator.module';
import { DealerModule } from './role-pages/dealer/dealer.module';
import { HostOwnerModule } from './role-pages/host-owner/host-owner.module';
import { AdvertiserModule } from './role-pages/advertiser/advertiser.module';
import { TechnicalModule } from './role-pages/technical/technical.module';
import { AuthService } from './global/services/auth-service/auth.service';
import { AuthGuard } from './global/guards/auth/auth.guard';
import { InstallationsModule } from './role-pages/administrator/pages/installations/installations.module';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		HttpClientModule,
		NotfoundModule,
		AdministratorModule,
		DealerModule,
		HostOwnerModule,
		AdvertiserModule,
		TechnicalModule,
		UserLoginModule,
		AppRoutingModule,
		InstallationsModule
	],
	providers: [AuthService, AuthGuard],
	bootstrap: [AppComponent]
})

export class AppModule { }
