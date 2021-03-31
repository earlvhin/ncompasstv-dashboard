import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; 
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { environment } from '../../environments/environment';
import { AdvertiserViewComponent } from './components_shared/locator_components/advertiser-view/advertiser-view.component';
import { AgmCoreModule } from '@agm/core';
import { AssignLicenseModalComponent } from './components_shared/license_components/assign-license-modal/assign-license-modal.component';
import { AutocompleteFieldComponent } from './components_shared/page_components/autocomplete-field/autocomplete-field.component';
import { BannerComponent } from './components_shared/page_components/banner/banner.component';
import { BulkOptionsComponent } from './components_shared/playlist_components/bulk-options/bulk-options.component';
import { BulkPlaywhereComponent } from './components_shared/playlist_components/bulk-playwhere/bulk-playwhere.component';
import { CategoryModalComponent } from './components_shared/category_components/category-modal/category-modal.component';
import { ClonePlaylistComponent } from './components_shared/playlist_components/clone-playlist/clone-playlist.component';
import { CloneScreenComponent } from './components_shared/screen_components/clone-screen/clone-screen.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { ConfirmTemplateModalComponent } from './components_shared/template_components/confirm-template-modal/confirm-template-modal.component';
import { ConfirmationModalComponent } from './components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { CreateAdvertiserComponent } from './pages_shared/create-advertiser/create-advertiser.component';
import { CreateFeedComponent } from './components_shared/feed_components/create-feed/create-feed.component';
import { CreateHostComponent } from './pages_shared/create-host/create-host.component';
import { CreatePlaylistComponent } from './pages_shared/create-playlist/create-playlist.component';
import { CreatePlaylistContentComponent } from './components_shared/playlist_components/create-playlist-content/create-playlist-content.component';
import { CreateScreenComponent } from './pages_shared/create-screen/create-screen.component';
import { CreateUserComponent } from './pages_shared/create-user/create-user.component';
import { CreateUserTypeComponent } from './pages_shared/create-user-type/create-user-type.component';
import { DataCardCompareComponent } from './components_shared/data_components/data-card-compare/data-card-compare.component';
import { DataCardComponent } from './components_shared/data_components/data-card/data-card.component';
import { DataCardCountComponent } from './components_shared/data_components/data-card-count/data-card-count.component';
import { DataGraphComponent } from './components_shared/data_components/data-graph/data-graph.component';
import { DataTableComponent } from './components_shared/data_components/data-table/data-table.component';
import { DefaultDateFormatDirective } from './directives/default-date-format.directive';
import { DealerContentTabComponent } from './components_purpose-built/single-dealer-tabs/dealer-content-tab/dealer-content-tab.component';
import { DealerDetailsTabComponent } from './components_purpose-built/single-dealer-tabs/dealer-details-tab/dealer-details-tab.component';
import { DealerHistoryTabComponent } from './components_purpose-built/single-dealer-tabs/dealer-history-tab/dealer-history-tab.component';
import { DealerHostTabComponent } from './components_purpose-built/single-dealer-tabs/dealer-host-tab/dealer-host-tab.component';
import { DealerInvoicesTabComponent } from './components_purpose-built/single-dealer-tabs/dealer-invoices-tab/dealer-invoices-tab.component';
import { DealerMapTabComponent } from './components_purpose-built/single-dealer-tabs/dealer-map-tab/dealer-map-tab.component';
import { DealerViewComponent } from './components_shared/locator_components/dealer-view/dealer-view.component';
import { DealersTableComponent } from './components_purpose-built/dealers-table/dealers-table.component';
import { DeletePlaylistComponent } from './components_shared/playlist_components/delete-playlist/delete-playlist.component';
import { DemoZoneComponent } from './components_shared/zone_components/demo-zone/demo-zone.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { EditFeedComponent } from './components_shared/feed_components/edit-feed/edit-feed.component';
import { EditSingleAdvertiserComponent } from './pages_shared/edit-single-advertiser/edit-single-advertiser.component';
import { EditSingleDealerComponent } from './pages_shared/edit-single-dealer/edit-single-dealer.component';
import { EditSingleHostComponent } from './pages_shared/edit-single-host/edit-single-host.component';
import { EditableFieldModalComponent } from './components_shared/page_components/editable-field-modal/editable-field-modal.component';
import { ErrorMessageComponent } from './components_shared/page_components/error-message/error-message.component';
import { ExpansionPanelComponent } from './components_shared/data_components/expansion-panel/expansion-panel.component';
import { FailAnimationComponent } from './components_shared/page_components/fail-animation/fail-animation.component';
import { FilenamePipe } from './pipes/filename.pipe';
import { FilterLabelsComponent } from './components_shared/media_components/filter-labels/filter-labels.component';
import { FooterComponent } from './components_shared/page_components/footer/footer.component';
import { HostViewComponent } from './components_shared/locator_components/host-view/host-view.component';
import { InformationModalComponent } from './components_shared/page_components/information-modal/information-modal.component';
import { IsEmptyPipe } from './pipes/is-empty.pipe';
import { IsFeedPipe } from './pipes/is-feed.pipe';
import { IsimagePipe } from './pipes/isimage.pipe';
import { IsvideoPipe } from './pipes/isvideo.pipe';
import { LicenseModalComponent } from './components_shared/license_components/license-modal/license-modal.component';
import { ListItemComponent } from './components_shared/data_components/list-item/list-item.component';
import { LittleSpinnerComponent } from './components_shared/page_components/little-spinner/little-spinner.component';
import { LocatorComponent } from './pages_shared/locator/locator.component';
import { MediaComponent } from './components_shared/media_components/media/media.component';
import { MediaLibraryComponent } from './pages_shared/media-library/media-library.component';
import { MediaLibraryOptionsComponent } from './components_shared/media_components/media-library-options/media-library-options.component';
import { MediaModalComponent } from './components_shared/media_components/media-modal/media-modal.component';
import { MediaPlaywhereComponent } from './components_shared/playlist_components/media-playwhere/media-playwhere.component';
import { MediaViewerComponent } from './components_shared/media_components/media-viewer/media-viewer.component';
import { MomentDateModule } from '@angular/material-moment-adapter';
import { NavbarComponent } from './components_shared/page_components/navbar/navbar.component';
import { NewAdminComponent } from './components_shared/user_components/user-forms/new-admin/new-admin.component';
import { NewAdvertiserComponent } from './components_shared/user_components/user-forms/new-advertiser/new-advertiser.component';
import { NewDealerComponent } from './components_shared/user_components/user-forms/new-dealer/new-dealer.component';
import { NewHostUserComponent } from './components_shared/user_components/user-forms/new-host-user/new-host-user.component';
import { NewTechrepComponent } from './components_shared/user_components/user-forms/new-techrep/new-techrep.component';
import { NewZoneComponent } from './components_shared/zone_components/new-zone/new-zone.component';
import { NewZoneModalComponent } from './components_shared/zone_components/new-zone-modal/new-zone-modal.component';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { NgxPaginationModule } from 'ngx-pagination';
import { NohandlePipe } from './pipes/nohandle.pipe';
import { ObjectKeysPipe } from './pipes/object-keys.pipe';
import { OptionsComponent } from './components_shared/playlist_components/options/options.component';
import { PaginationFieldComponent } from './components_shared/page_components/pagination-field/pagination-field.component';
import { PlayWhereComponent } from './components_shared/playlist_components/play-where/play-where.component';
import { PlaylistContentComponent } from './components_shared/playlist_components/playlist-content/playlist-content.component';
import { PlaylistContentPanelComponent } from './components_shared/playlist_components/playlist-content-panel/playlist-content-panel.component';
import { PlaylistContentSchedulingDialogComponent } from './components_shared/playlist_components/playlist-content-scheduling-dialog/playlist-content-scheduling-dialog.component';
import { PlaylistCreatedModalComponent } from './components_shared/playlist_components/playlist-created-modal/playlist-created-modal.component';
import { PlaylistDemoComponent } from './components_shared/playlist_components/playlist-demo/playlist-demo.component';
import { PlaylistEditModalComponent } from './components_shared/playlist_components/playlist-edit-modal/playlist-edit-modal.component';
import { PlaylistHostComponent } from './components_shared/playlist_components/playlist-host/playlist-host.component';
import { PlaylistInfoComponent } from './components_shared/playlist_components/playlist-info/playlist-info.component';
import { PlaylistMediaComponent } from './components_shared/playlist_components/playlist-media/playlist-media.component';
import { PlaylistMediaThumbnailComponent } from './components_shared/playlist_components/playlist-media-thumbnail/playlist-media-thumbnail.component';
import { PushUpdateComponent } from './components_shared/playlist_components/push-update/push-update.component';
import { RenameModalComponent } from './components_shared/media_components/rename-modal/rename-modal.component';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { ScreenCreatedModalComponent } from './components_shared/screen_components/screen-created-modal/screen-created-modal.component';
import { ScreenDemoComponent } from './components_shared/screen_components/screen-demo/screen-demo.component';
import { ScreenItemComponent } from './components_shared/screen_components/screen-item/screen-item.component';
import { ScreenLicenseComponent } from './components_shared/screen_components/screen-license/screen-license.component';
import { ScreenshotPipe } from './pipes/screenshot.pipe';
import { SearchFieldComponent } from './components_shared/page_components/search-field/search-field.component';
import { SidebarComponent } from './components_shared/page_components/sidebar/sidebar.component';
import { SingleAdvertiserComponent } from './pages_shared/single-advertiser/single-advertiser.component';
import { SingleBillingsComponent } from './pages_shared/single-billings/single-billings.component';
import { SingleContentComponent } from './pages_shared/single-content/single-content.component';
import { SingleDealerComponent } from './pages_shared/single-dealer/single-dealer.component';
import { SingleDealerSidebarComponent } from './components_purpose-built/single-dealer-sidebar/single-dealer-sidebar.component';
import { SingleHostComponent } from './pages_shared/single-host/single-host.component';
import { SingleLicenseComponent } from './pages_shared/single-license/single-license.component';
import { SinglePlaylistComponent } from './pages_shared/single-playlist/single-playlist.component';
import { SingleScreenComponent } from './pages_shared/single-screen/single-screen.component';
import { SingleUserComponent } from './pages_shared/single-user/single-user.component';
import { SpinnerComponent } from './components_shared/page_components/spinner/spinner.component';
import { SubstringPipe } from './pipes/substring.pipe';
import { SuccessAnimationComponent } from './components_shared/page_components/success-animation/success-animation.component';
import { TemplateMinimapComponent } from './components_shared/template_components/template-minimap/template-minimap.component';
import { TemplateZonesComponent } from './components_shared/template_components/template-zones/template-zones.component';
import { ThumbnailCardComponent } from './components_shared/media_components/thumbnail-card/thumbnail-card.component';
import { ToolsComponent } from './pages_shared/tools/tools.component';
import { UnassignHostLicenseComponent } from './components_shared/license_components/unassign-host-license/unassign-host-license.component';
import { UnassignLicenseComponent } from './components_shared/screen_components/unassign-license/unassign-license.component';
import { UserAccountSettingComponent } from './pages_shared/user-account-setting/user-account-setting.component';
import { UserProfileComponent } from './pages_shared/user-profile/user-profile.component';
import { UserSortModalComponent } from './components_shared/media_components/user-sort-modal/user-sort-modal.component';
import { UserTypeComponent } from './components_shared/user_components/user-type/user-type.component';
import { WarningAnimationComponent } from './components_shared/page_components/warning-animation/warning-animation.component';
import { WarningPopupComponent } from './components_shared/page_components/warning-popup/warning-popup.component'; 
import { ZoneListComponent } from './components_shared/zone_components/zone-list/zone-list.component';

const config: SocketIoConfig = { url: environment.socket_server, options: { autoConnect: false }  };

// Material Theme Module
import { 
	MatAutocompleteModule,
	MatCardModule,
	MatCheckboxModule,
	MatButtonModule,
	MatMenuModule,
	MatExpansionModule,
	MatDividerModule,
	MatListModule,
	MatTableModule,
	MatSlideToggleModule,
	MatInputModule,
	MatTabsModule,
	MatStepperModule,
	MatSelectModule,
	MatDialogModule,
	MatProgressSpinnerModule,
	MatPaginatorModule,
	MatRadioModule,
	MatDatepickerModule,
	MatNativeDateModule,
	MatProgressBarModule,
	MatTooltipModule,
	MatIconModule,
} from '@angular/material';

const ngComponents = [
	AdvertiserViewComponent,
	AssignLicenseModalComponent,
	AssignLicenseModalComponent,
	AutocompleteFieldComponent,
	AutocompleteFieldComponent,
	BannerComponent,
	BulkOptionsComponent,
	BulkPlaywhereComponent,
	CategoryModalComponent,
	ClonePlaylistComponent,
	CloneScreenComponent,
	ConfirmTemplateModalComponent,
	ConfirmationModalComponent,
	CreateAdvertiserComponent,
	CreateFeedComponent,
	CreateHostComponent,
	CreatePlaylistComponent,
	CreatePlaylistContentComponent,
	CreateScreenComponent,
	CreateUserComponent,
	CreateUserTypeComponent,
	DataCardCompareComponent,
	DataCardComponent,
	DataCardCountComponent,
	DataGraphComponent,
	DataTableComponent,
	DealerContentTabComponent,
	DealerDetailsTabComponent,
	DealerHistoryTabComponent,
	DealerHostTabComponent,
	DealerInvoicesTabComponent,
	DealerMapTabComponent,
	DealerViewComponent,
	DealersTableComponent,
	DeletePlaylistComponent,
	DemoZoneComponent,
	EditFeedComponent,
	EditSingleAdvertiserComponent,
	EditSingleDealerComponent,
	EditSingleHostComponent,
	EditableFieldModalComponent,
	ErrorMessageComponent,
	ErrorMessageComponent,
	ExpansionPanelComponent,
	FailAnimationComponent,
	FilenamePipe,
	FilterLabelsComponent,
	FooterComponent, 
	HostViewComponent,
	InformationModalComponent,
	IsEmptyPipe,
	IsFeedPipe,
	IsimagePipe,
	IsvideoPipe,
	LicenseModalComponent,
	ListItemComponent,
	LittleSpinnerComponent,
	LocatorComponent,
	MediaComponent,
	MediaLibraryComponent,
	MediaLibraryOptionsComponent,
	MediaModalComponent,
	MediaPlaywhereComponent,
	MediaViewerComponent,
	MediaPlaywhereComponent,
	NavbarComponent,
	NewAdminComponent,
	NewAdvertiserComponent,
	NewDealerComponent,
	NewHostUserComponent,
	NewTechrepComponent,
	NewZoneComponent,
	NewZoneModalComponent,
	NohandlePipe,
	ObjectKeysPipe,
	OptionsComponent,
  	PaginationFieldComponent,
	PlayWhereComponent,
	PlaylistContentComponent,
	PlaylistContentPanelComponent,
	PlaylistContentSchedulingDialogComponent,
	PlaylistCreatedModalComponent,
	PlaylistDemoComponent,
	PlaylistEditModalComponent,
	PlaylistHostComponent,
	PlaylistHostComponent,
	PlaylistHostComponent,
	PlaylistInfoComponent,
	PlaylistMediaComponent,
	PlaylistMediaThumbnailComponent,
	PushUpdateComponent,
	RenameModalComponent,
	SanitizePipe,
	ScreenCreatedModalComponent,
	ScreenDemoComponent,
	ScreenItemComponent,
	ScreenLicenseComponent,
	ScreenshotPipe,
	SearchFieldComponent,
	SearchFieldComponent,
	SidebarComponent,
	SingleAdvertiserComponent,
	SingleBillingsComponent,
	SingleContentComponent,
	SingleDealerComponent,
	SingleDealerSidebarComponent,
	SingleHostComponent,
	SingleLicenseComponent,
	SinglePlaylistComponent,
	SingleScreenComponent,
	SingleUserComponent,
	SpinnerComponent,
	SuccessAnimationComponent,
	SubstringPipe,
	TemplateMinimapComponent,
	TemplateZonesComponent,
	ThumbnailCardComponent, 
	ToolsComponent,
	UnassignHostLicenseComponent,
	UnassignLicenseComponent,
	UserAccountSettingComponent,
	UserProfileComponent,
	UserSortModalComponent,
	UserSortModalComponent,
	UserTypeComponent,
	WarningAnimationComponent,
	WarningPopupComponent,
	WarningPopupComponent,
	ZoneListComponent
]

const MaterialModules = [
	MatAutocompleteModule,
	MatButtonModule,
	MatCardModule,
	MatCheckboxModule,
	MatDialogModule,
	MatDividerModule,
	MatExpansionModule,
	MatIconModule,
	MatInputModule,
	MatListModule,
	MatMenuModule,
	MatPaginatorModule,
	MatRadioModule,
	MatProgressSpinnerModule,
	MatSelectModule,
	MatSlideToggleModule,
	MatStepperModule,
	MatTableModule,
	MatTabsModule,
	MatDatepickerModule,
	MatNativeDateModule,
	MatProgressBarModule,
	MatTooltipModule
]

@NgModule({
	declarations: [
		ngComponents,
		DefaultDateFormatDirective,
		DeletePlaylistComponent
	],
	entryComponents: [
		AssignLicenseModalComponent,
		BulkOptionsComponent,
		CategoryModalComponent,
		ClonePlaylistComponent,
		CloneScreenComponent,
		ConfirmTemplateModalComponent,
		ConfirmationModalComponent,
		CreateFeedComponent,
		DeletePlaylistComponent,
		EditFeedComponent,
		EditSingleAdvertiserComponent,
		EditSingleDealerComponent,
		EditSingleHostComponent,
		EditableFieldModalComponent,
		InformationModalComponent,
		LicenseModalComponent,
		MediaModalComponent,
		MediaPlaywhereComponent,
		MediaViewerComponent,
		NewZoneModalComponent,
		OptionsComponent,
		PlaylistContentSchedulingDialogComponent,
		PlaylistCreatedModalComponent,
		PlaylistDemoComponent,
		PlaylistEditModalComponent,
		PlaylistMediaComponent,
		PushUpdateComponent,
		RenameModalComponent,
		ScreenCreatedModalComponent,
		ScreenLicenseComponent,
		UnassignHostLicenseComponent,
		UnassignLicenseComponent,
		UserSortModalComponent,
		WarningPopupComponent
	],
	imports: [
		BrowserAnimationsModule,
		ColorPickerModule,
		CommonModule,
		DragDropModule,
		FormsModule,
		HttpClientModule,
		MaterialModules,
		MatInputModule,
		MatDatepickerModule, 
		MatNativeDateModule, 
		MomentDateModule,
		NgbModule,
		NgxMaterialTimepickerModule,
		NgxPaginationModule,
		ReactiveFormsModule,
		RouterModule,
		AgmCoreModule.forRoot({
			apiKey: environment.google_key
		}),
		SocketIoModule.forRoot(config)
	],
	exports: [
		ngComponents,
		DefaultDateFormatDirective,
	],
	providers: [
		MatDatepickerModule,
		MatNativeDateModule
	]
})

export class GlobalModule { }
