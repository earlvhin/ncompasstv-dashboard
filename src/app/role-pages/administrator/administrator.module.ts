import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { ADMINISTRATOR_ROUTES } from './administrator.routes';
import { AdministratorLayoutComponent } from './administrator-layout/administrator-layout.component';
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { BreadcrumbsModule } from 'ng6-breadcrumbs';
import { CategoriesComponent } from './pages/categories/categories.component';
import { CreateTemplateComponent } from './pages/create-template/create-template.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DealersComponent } from './pages/dealers/dealers.component';
import { DirectoryComponent } from './pages/directory/directory.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FeedsModule } from 'src/app/global/pages_shared/feeds/feeds.module';
import { GlobalModule } from '../../global/global.module';
import { HostsComponent } from './pages/hosts/hosts.component';
import { LicensesModule } from './pages/licenses/licenses.module';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { RolesComponent } from './pages/roles/roles.component';
import { SingleLicenseModule } from 'src/app/global/pages_shared/single-license/single-license.module';
import { ScreensComponent } from './pages/screens/screens.component';
import { TagsModule } from 'src/app/global/pages_shared/tags/tags.module';
import { TemplatesComponent } from './pages/templates/templates.component';
import { UsersComponent } from './pages/users/users.component';
import { UpdateComponent } from './pages/update/update.component';
import { SingleHostModule } from 'src/app/global/pages_shared/single-host/single-host.module';
import { InstallationsModule } from './pages/installations/installations.module';
import { BillingsViewComponent } from './pages/dealers/billings-view/billings-view.component';
import { DmaViewComponent } from './pages/hosts/dma-view/dma-view.component';
import { InvoiceViewComponent } from './pages/dealers/invoice-view/invoice-view.component';
import { ReleaseNotesModule } from './pages/release-notes/release-notes.module';

@NgModule({
	declarations: [
		AdministratorLayoutComponent,
		AdvertisersComponent,
		CategoriesComponent,
		DashboardComponent,
		DealersComponent,
		DirectoryComponent,
		CreateTemplateComponent,
		HostsComponent,
		PlaylistsComponent,
		ReportsComponent,
		TemplatesComponent,
		ScreensComponent,
		RolesComponent,
		UsersComponent,
		UpdateComponent,
		BillingsViewComponent,
		DmaViewComponent,
		InvoiceViewComponent
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
		BreadcrumbsModule,
		SingleLicenseModule,
		TagsModule,
		FeedsModule,
		SingleHostModule,
		InstallationsModule,
		ReleaseNotesModule,
		LicensesModule,
		RouterModule.forChild(ADMINISTRATOR_ROUTES)
	],
	providers: [AuthGuard]
})
export class AdministratorModule {}
