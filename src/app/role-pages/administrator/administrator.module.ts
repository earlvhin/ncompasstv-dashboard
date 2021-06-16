import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorPickerModule } from 'ngx-color-picker';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GlobalModule } from '../../global/global.module';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { ADMINISTRATOR_ROUTES } from './administrator.routes';
import { ReactiveFormsModule } from '@angular/forms';
import { AdministratorLayoutComponent } from './administrator-layout/administrator-layout.component';
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { BillingsComponent } from './pages/billings/billings.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DealersComponent } from './pages/dealers/dealers.component';
import { DirectoryComponent } from './pages/directory/directory.component';
import { CreateTemplateComponent } from './pages/create-template/create-template.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { RolesComponent } from './pages/roles/roles.component';
import { UsersComponent } from './pages/users/users.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FeedsComponent } from './pages/feeds/feeds.component';
import { InstallationsComponent } from './pages/installations/installations.component';
import { UpdateComponent } from './pages/update/update.component';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
@NgModule({
	declarations: [
		AdministratorLayoutComponent, 
		AdvertisersComponent, 
		BillingsComponent, 
		CategoriesComponent,
		DashboardComponent,
		DealersComponent,
		DirectoryComponent,
		CreateTemplateComponent,
		HostsComponent,
		LicensesComponent,
		PlaylistsComponent,
		ReportsComponent,
		TemplatesComponent,
		ScreensComponent,
		RolesComponent,
		UsersComponent,
		FeedsComponent,
		InstallationsComponent,
		UpdateComponent,
	],
	imports: [
		CommonModule,
		ColorPickerModule,
		FormsModule,
		GlobalModule,
		ReactiveFormsModule,
		MatCardModule,
		MatButtonModule,
		MatAutocompleteModule,
		MatInputModule,
		MatMenuModule,
		MatSelectModule,
		MatExpansionModule,
		DragDropModule,
		NgbModule,
		RouterModule.forChild(ADMINISTRATOR_ROUTES)
	],
	providers: [
		AuthGuard
	]
})
export class AdministratorModule { }
