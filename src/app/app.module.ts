import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
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
import { ReassignDealerModule } from './global/pages_shared/edit-single-dealer/reassign-dealer/reassign-dealer.module';
import { ViewContentListModule } from './global/components_shared/playlist_components/view-content-list/view-content-list.module';
import { SubDealerModule } from './role-pages/sub-dealer/sub-dealer.module';
import { TagsModule } from './global/pages_shared/tags/tags.module';
import { HttpErrorInterceptor } from './global/middlewares/http-interceptor/http-error.interceptor';
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
        SubDealerModule,
		UserLoginModule,
		AppRoutingModule,
		ReassignDealerModule,
		ViewContentListModule,
		TagsModule,
	],
	providers: [
		{provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true},
		AuthService, 
		AuthGuard
	],
	bootstrap: [AppComponent]
})

export class AppModule { }
