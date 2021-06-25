import { DatePipe } from '@angular/common';
import { Component, OnInit, EventEmitter, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable, Subject } from 'rxjs';
import { Chart } from 'chart.js';
import * as io from 'socket.io-client';
import * as moment from 'moment-timezone';

import { API_CONTENT } from '../../models/api_content.model';
import { API_HOST } from '../../models/api_host.model';
import { API_LICENSE_PROPS } from '../../models/api_license.model';
import { API_TEMPLATE } from '../../models/api_template.model';
import { API_SINGLE_SCREEN, API_SCREEN_ZONE_PLAYLISTS_CONTENTS, API_SCREEN_TEMPLATE_ZONE } from '../../models/api_single-screen.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from '../../services/content-service/content.service';
import { environment } from '../../../../environments/environment';
import { InformationModalComponent } from '../../components_shared/page_components/information-modal/information-modal.component';
import { LicenseService } from '../../services/license-service/license.service';
import { MediaViewerComponent } from '../../components_shared/media_components/media-viewer/media-viewer.component';
import { ScreenService } from '../../services/screen-service/screen.service';
import { TemplateService } from '../../services/template-service/template.service';
import { UI_CONTENT, UI_CONTENT_PER_ZONE } from '../../models/ui_content.model';
import { UI_OPERATION_DAYS } from '../../models/ui_operation-hours.model';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { UI_SCREEN_ZONE_PLAYLIST, UI_ZONE_PLAYLIST, UI_SCREEN_LICENSE, UI_SINGLE_SCREEN } from '../../models/ui_single-screen.model';
import { HelperService } from '../../services/helper-service/helper.service';
@Component({
	selector: 'app-single-license',
	templateUrl: './single-license.component.html',
	styleUrls: ['./single-license.component.scss'],
	providers: [DatePipe]
})

export class SingleLicenseComponent implements OnInit, OnDestroy {
	anydesk_id: string;
	anydesk_restarting: boolean = false;
	apps: any;
	assets_breakdown = { advertisers: 0, feeds: 0, fillers: 0, hosts: 0, others: 0 };
	background_zone_selected: boolean = false;
	business_hours: { day: string, periods: string[], selected: boolean }[] = [];
	charts: any[] = [];
	clear_screenshots: boolean = false;
	content_count$: Observable<API_CONTENT[]>;
	content_counter = 0;
	content_id: string;
	content_per_zone: UI_CONTENT_PER_ZONE[];
	content_play_count: API_CONTENT[] = [];
	content_time_update: string;
	contents: API_CONTENT[] = [];
	contents_array: any = [];
	current_operation: { day: string, period: string };
	current_month = new Date().getMonth() + 1;
	current_tab = 'Details';
	current_year = new Date().getFullYear();
	current_zone_name_selected: string;
	daily_chart_updating = true;
	daily_content_count: API_CONTENT[] = [];
	dealer_route: string;
	default_selected_month: string = this._date.transform(`${this.current_year}-${this.current_month}`, 'y-MM');
	duration_breakdown = { advertisers: 0, feeds: 0, fillers: 0, hosts: 0, others: 0, total: 0 };
	duration_breakdown_text = { advertisers: '0 sec', feeds: '0s', fillers: '0s', hosts: '0s', others: '0s', total: '0s' }; 
	enable_edit_alias: boolean = false;
	eventsSubject: Subject<void> = new Subject<void>();
	filters: any;
	has_background_zone = false;
	has_playlist = false;
	host: API_HOST;
	host_notes = '';
	host_route: string;
	initial_load_charts = true;
	internet_connection = { downloadMbps: 'N/A', uploadMbps: 'N/A', ping: 'N/A',  date: 'N/A' };
	is_dealer: boolean = false;
	is_new_standard_template = false;
	license_data: any;
	license_id: string;
	license_key: string;
	minimap_width = '400px';
	monthly_chart_updating = true;
	monthly_content_count: API_CONTENT[] = [];
	no_screen_assigned = false;
	number_of_contents: any;
	pi_status: boolean;
	pi_updating: boolean;
	player_status: boolean;
	playlist_route: string;
	popup_message = '';
	popup_type = '';
	queried_date: string;
	realtime_data: EventEmitter<any> = new EventEmitter();
	routes: string;
	screen: any;
	screen_loading = true;
	screen_route: string;
	screenshot_message: string = "Taking Screenshot, Please wait. . .";
	screenshot_timeout = false;
	screenshots = [];
	screen_zone: any = {};
	screen_type: any = {};
	selected_display_mode: string = 'monthly';
	selected_month = this.default_selected_month;
	selected_zone_index = 0;
	speedtest_running: boolean = false;
	show_hours = false;
	show_popup = false;
	status_check_disabled: boolean;
	storage_capacity = '';
	subscriptions: Subscription = new Subscription;
	template_data: API_TEMPLATE;
	timezone: any;
	title: string[] = [];
	update_alias: FormGroup;
	update_btn: string = 'Content Update';
	yearly_chart_updating = true;
	yearly_content_count: API_CONTENT[] = [];
	zone_order: number = 0;
	zone_playlists: UI_ZONE_PLAYLIST[];

	destroy_daily_charts: boolean = false;
	destroy_monthly_charts: boolean = false;
	current_display_mode: string; 
	analytics_reload: Subject<void> = new Subject<void>();

	_socket: any;
	is_admin: boolean = false;
	thumb_no_socket: boolean = true;
	terminal_value: string;
	terminal_entered_scripts: string[] = [];

	display_mode = [
		{value: 'daily', viewValue: 'Daily'},
		{value: 'monthly', viewValue: 'Monthly'},
		{value: 'yearly', viewValue: 'Yearly'}
	];

	months = [
		{value: `${this.current_year}-01`, viewValue: 'January'},
		{value: `${this.current_year}-02`, viewValue: 'February'},
		{value: `${this.current_year}-03`, viewValue: 'March'},
		{value: `${this.current_year}-04`, viewValue: 'April'},
		{value: `${this.current_year}-05`, viewValue: 'May'},
		{value: `${this.current_year}-06`, viewValue: 'June'},
		{value: `${this.current_year}-07`, viewValue: 'July'},
		{value: `${this.current_year}-08`, viewValue: 'August'},
		{value: `${this.current_year}-09`, viewValue: 'September'},
		{value: `${this.current_year}-10`, viewValue: 'October'},
		{value: `${this.current_year}-11`, viewValue: 'November'},
		{value: `${this.current_year}-12`, viewValue: 'December'}
	];

	constructor(
		private _auth: AuthService,
		private _content: ContentService,
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _helper: HelperService,
		private _license: LicenseService,
		private _params: ActivatedRoute,
		private _router: Router,
		private _screen: ScreenService,
		private _template: TemplateService
	) { }

	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.adjustMinimapWidth();
	}

	ngOnInit() {

		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
            query: 'client=Dashboard__SingleLicenseComponent',
		});

		this.routes = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this.pi_status = false;
		this.getLicenseInfo();
		this.socket_piPlayerStatus();
		this.socket_screenShotFailed();
		this.socket_screenShotSuccess();
		this.socket_updateCompleted();
		this.socket_licenseOffline();
		this.socket_getAnydeskID();
		this.socket_speedtestSuccess();
		this.socket_deadUI();
		this.socket_licenseOnline();
		this.onInitTasks();

		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
		}

		if (roleId === UI_ROLE_DEFINITION.administrator) {
			this.is_admin = true;
		}

		this._socket.on('connect', () => {
			console.log('#SingleLicenseComponent - Connected to Socket Server');
		});
		
		this._socket.on('disconnect', () => {
			console.log('#SingleLicenseComponent - Disconnnected to Socket Server');
		});

		this._helper.singleLicensePageCurrentTab = this.current_tab;

		// this.getContentReport_monthly(this._date.transform(this.queried_date, 'y-MM-dd'));
		// this.getContentReport_daily(this._date.transform(this.queried_date, 'y-MM-dd'));
		// this.getContentReport_yearly();
	
	}

	ngAfterViewInit() {
		this.adjustMinimapWidth();
	}

	ngOnDestroy() {
		this.subscriptions.unsubscribe();
		this._socket.disconnect();
		this.destroyCharts();
	}

	get f() {
		return this.update_alias.controls;
	}

	activateEdit(x): void {
		if(x) {
			this.update_alias.controls['alias'].enable();
			this.enable_edit_alias = true;
		} else {
			this.update_alias.controls['alias'].disable();
			this.enable_edit_alias = false;
		}
	}

	clearScreenshots(): void {
		this.clear_screenshots = true;

		this.subscriptions.add(
			this._license.delete_screenshots(this.license_id).subscribe(
				() => {
					this.clear_screenshots = false;
					this.getScreenshots(this.license_id);
				},
				error => console.log('Error clearing screenshots', error)
			)
		);

	}

	dismissPopup(): void {
		this.show_popup = false;
		this.popup_type = '';
	}

	displayPopup(message: string, type = ''): void {
		this.popup_message = message;
		this.popup_type = type;
		this.show_popup = true;

		setTimeout(() => {
			this.dismissPopup();
		}, 5000);
	}

	displayModeSelected(e): void {
		this.destroy_monthly_charts = true;
		this.destroy_daily_charts = true;
		this.current_display_mode = e;

		if (e === 'monthly') {
			this.queried_date = this._date.transform(new Date(), 'longDate');
			this.destroy_monthly_charts = false;
			this.getContentReport_monthly(this._date.transform(new Date(), 'y-MM'))
		} else {
			this.destroy_daily_charts = false;
			this.queried_date = this._date.transform(new Date(), 'longDate');
			this.getContentReport_daily(this._date.transform(new Date(), 'y-MM-dd'))
		}
	}

	getContentByLicenseId(id: string): void {
		this.subscriptions.add(
			this._content.get_content_by_license_id(id).subscribe(
				data => {
					if (data) {
						this.content_per_zone = this.mapZoneContentToUI(data);

						this.screen_zone = {
							playlistName : data[0].screenTemplateZonePlaylist.playlistName,
							playlistId: data[0].screenTemplateZonePlaylist.playlistId,
							dateCreated: data[0].screenTemplateZonePlaylist.dateCreated,
						};

						if (this.content_per_zone[0].zone_name && this.content_per_zone[0].zone_name === 'Background') {
							this.background_zone_selected = true;
						}

						this.current_zone_name_selected = this.content_per_zone[0].zone_name;
						
						this.has_playlist = true;
						this.breakdownContents();
						this.breakdownDuration();
						this.number_of_contents = this.content_per_zone[this.selected_zone_index].contents.length;
						this.playlist_route = "/" + this.routes + "/playlists/" + this.screen_zone.playlistId;
					}
				}
			)
		);
	}

	getContentReport(license: string, from: any, to: any): void {
		const log_params = { licenseId: license, from, to };

		this.subscriptions.add(
			this._content.get_content_count_by_license(log_params).subscribe(
			 	(data: API_CONTENT[]) => {
					if (data) {
						this.content_play_count = data.sort((a, b) => b.totalPlayed - a.totalPlayed);
					}
				}
			)
		);

	}

	getContentReport_daily(date): void {
		const data = { licenseId: this.license_id, from : date };
		this.daily_chart_updating = true;

		this.subscriptions.add(
			this._content.get_content_daily_count_by_license(data).subscribe(
				data => {
					this.daily_content_count = data;
					this.daily_chart_updating = false;
					this.destroy_daily_charts = false;

					setTimeout(() => {
						this.analytics_reload.next();
					}, 1000)
				},
				error => console.log('Error getting daily content count', error)
			)
		);
	}

	getContentReport_monthly(date): void {
		const data = { licenseId: this.license_id, from: date };
		this.monthly_chart_updating = true;
		
		this.subscriptions.add(
			this._content.get_content_monthly_count_by_license(data).subscribe(
				data => {
					this.monthly_content_count = data;
					this.monthly_chart_updating = false;
					this.destroy_monthly_charts = false;

					setTimeout(() => {
						this.analytics_reload.next();
					}, 1000)
				},
				error => console.log('Error getting monthly content count', error)
			)
		);
	}

	getContentReport_yearly(): void {
		const data = { licenseId: this.license_id };

		this.subscriptions.add(
			this._content.get_content_yearly_count_by_license(data).subscribe(
				data => {
					this.yearly_content_count = data;
					this.yearly_chart_updating = false;
				},
				error => console.log('Error getting yearly content count', error)
			)
		);

	}

	getFormValue(): void {
		this.update_alias = this._form.group({
			alias: [{value: this.license_data.alias, disabled: true},  Validators.required],
		});
	}

	getLicenseById(id: string): void {

		this.subscriptions.add(this._license.get_license_by_id(id)
			.subscribe(
				(data: any) => {
					this.title = data.license.alias;
					this.license_key = data.license.licenseKey;
					this.license_data = data.license;
					this.setStorageCapacity(this.license_data.freeStorage, this.license_data.totalStorage);
					this.timezone = data.timezone;
					this.anydesk_id = data.license.anydeskId;

					const updated = this.license_data.contentsUpdated;
					const format = 'MMMM DD, YYYY, h:mm:ss A';
					this.content_time_update = updated != null ? moment.utc(new Date(updated)).format(format) : null;
					
					this.screen_type = data.screenType ? data.screenType : null;
					this.apps = data.license.appVersion ? JSON.parse(data.license.appVersion) : null;

					if (data.license.internetInfo) {

						const download = JSON.parse(data.license.internetInfo).downloadMbps;
						const upload = JSON.parse(data.license.internetInfo).uploadMbps;
						const ping = JSON.parse(data.license.internetInfo).ping;
						const date = JSON.parse(data.license.internetInfo).date;

						this.internet_connection.downloadMbps = download ? `${download.toFixed(2)} Mbps` : 'N/A';
						this.internet_connection.uploadMbps = upload ? `${upload.toFixed(2)} Mbps` : 'N/A';
						this.internet_connection.ping = ping ? `${ping.toFixed(2)} ms` : 'N/A';
						this.internet_connection.date = date ? `${date}` : 'N/A';

					}

					if (this.license_data.internetType != null) {

						if (this.license_data.internetType.charAt(0) === 'e') {
							this.license_data.internetType = 'Lan'
						} else if (this.license_data.internetType.charAt(0) === 'w') {
							this.license_data.internetType = 'Wi-fi'
						} else {
							this.license_data.internetType == this.license_data.internetType
						}

					}

					this.getScreenById(data.screen.screenId, this.license_id);
					this.getFormValue();
				},
				error => console.log('Error retrieving license by ID', error)
			)
		);

	}

	getLicenseInfo(): void {
		this.subscriptions.add(
			this._params.paramMap.subscribe(
				() => {
					this.license_id = this._params.snapshot.params.data;
					this.getLicenseById(this.license_id);
					this.getScreenshots(this.license_id);
					this.getContentByLicenseId(this.license_id);
				}
			)
		);
	}

	getScreenById(id: string, licenseId?: string): void {

		this.subscriptions.add(this._screen.get_screen_by_id(id, licenseId)
			.subscribe(
				(response: { contents, createdBy, dealer, host, licenses, screen, screenZonePlaylistsContents, template, timezone, message }) => {

					if (response.message) {
						this.no_screen_assigned = true;
						return;
					}
					
					this.screen = this.mapScreenToUI(response);
					this.setHostDetails(response.host);
					this.getTemplateData(response.template.templateId);
					this.setPlaylists(response.screenZonePlaylistsContents);
					this.setRoutes();
					this.screen_loading = false;

				},
				error => {
					console.log('Error retrieving screen', error);
					this.screen_loading = false;
					this.no_screen_assigned = true;
				}

			)
		);
	}

	getScreenshots(id): void {
		let count = 1;
		this.screenshots = [];

		this.subscriptions.add(this._license.get_screenshots(id)
			.subscribe(
				data => {
					data.forEach(s => {
						if (count <= data.length) {
							this.screenshots.push(`${environment.base_uri_old}${s.replace("/API/", "")}`);
						}
						count++;
					});

					setTimeout(() => {
						this.screenshot_timeout = false;
					}, 2000)
				},
				error => console.log('Error retrieving screenshots', error)
			)
		);
	}

	monthSelected(value: any): void {

		if (this.current_tab !== 'Analytics') return;
		
		if (this.selected_month == this.default_selected_month) {

			this.monthly_chart_updating = true;
			this.getContentReport_monthly(this._date.transform(value, 'y-MM'));

		} else {

			this.monthly_chart_updating = true;
			this.daily_chart_updating = true;

			this.getContentReport_monthly(this._date.transform(value, 'y-MM'));
			this.getContentReport_daily(this._date.transform(`${this.selected_month}-01`, 'y-MM-dd'))
			this.queried_date = this._date.transform(`${this.selected_month}-01`, 'longDate');

		}

	}

	onDateChange(value: any): void {

		if (this.selected_display_mode === 'daily') {

			this.queried_date = this._date.transform(value, 'longDate');
			this.monthly_chart_updating = true;
			this.daily_chart_updating = true;
			this.getContentReport_daily(this._date.transform(value, 'y-MM-dd'));
			this.getContentReport_monthly(this._date.transform(value, 'y-MM-dd'));

		} else if(this.selected_display_mode === 'yearly') {

			this.queried_date = this._date.transform(new Date(), 'longDate');
			this.yearly_chart_updating = true;
			this.getContentReport_yearly();

		}
	}

	onDeleteLicense(): void {

		const delete_dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'warning',
				message: 'Delete License',
				data: 'Are you sure you want to delete this license',
				return_msg: '',
				action: 'delete'
			}
		})

		delete_dialog.afterClosed()
			.subscribe(
				response => {
					if (response != 'delete') return;
					const array_to_delete = [];
					array_to_delete.push(this.license_id);

					this.subscriptions.add(
						this._license.delete_license(array_to_delete)
							.subscribe(
								() => {
									const roleId = this._auth.current_user_value.role_id;
									const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === roleId);
									this._router.navigate([`/${route}/licenses`]);
								},
								error => console.log('Error deleting license', error)
							)
					);
				}
			);

	}

	onInitTasks(): void {
		this._socket.once('SS_content_log', data => {
			if (data[0].licenseId == this.license_id) {
				this.realtime_data.emit(data);
			}
		});

		this._socket.once('SS_offline_player', data => {
			// console.log('SS_offline_player', data)
			if (data == this.license_id) {
				this.displayPopup('Oh snap! Your player with this license is currently offline', 'error');
				this.player_status = false;
			}
		});

		this._socket.once('SS_offline_pi', data => {
			// console.log('SS_offline_pi', data)
			if (data == this.license_id) {
				this.displayPopup('Oh snap! Your Pi with this license is currently offline', 'error');
				this.pi_status = false;
				this.player_status = false;
			}
		});

		let now = new Date();
		let utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
		this.queried_date = this._date.transform(utc, 'longDate');
	}

	onOpenMediaViewer(content: any[], index: number): void {

		const duration = content[index].duration;
		content[index].duration = Math.round(duration);

		this._dialog.open(MediaViewerComponent, {
			panelClass: 'app-media-viewer-dialog',
			data: {
				index,
				content_array: content,
				selected: content[index],
				zoneContent: true
			}
		});
		
	}

	openConfirmationModal(status: string, message: string, data: any): void {

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  { status, message, data }
		});

		dialogRef.afterClosed().subscribe(() => this.ngOnInit());

	}
	
	onSelectBackgroundZone(event: any): void {
		event.preventDefault();
		this._template.onSelectZone.emit('Background');
	}

	onShowHours(): void {
		this.showInformationModal('400px', 'auto', 'Business Hours', this.business_hours, 'list');
	}

	onShowNotes(): void {
		this.showInformationModal('600px', '350px', 'Notes', this.host.notes, 'textarea', 500);
	}

	setPopupBackground(): string {

		if (this.popup_type === 'error') return 'bg-danger'

		return 'bg-primary';

	}

	setRoutes(): void {
		this.screen_route = "/" + this.routes + "/screens/" + this.screen.screen_id;
		this.dealer_route = "/" + this.routes + "/dealers/" + this.screen.assigned_dealer_id;
		this.host_route = "/" + this.routes + "/hosts/" + this.screen.assigned_host_id;
	}

	tabSelected(event: { index: number }): void {
		let tab = '';

		switch (event.index) {
			case 1:
				tab = 'Content';
				// this.emitReloadMedia();

				if (this.initial_load_charts) {

					const contents = this.content_per_zone;
					this.initial_load_charts = false;

					if (contents && contents.length > 0) {
						setTimeout(() => {
							this.generateAssetsBreakdownChart();
							this.generateDurationBreakdownChart();
						}, 1000);
					}

				}

				this.destroy_monthly_charts = true;
				this.destroy_daily_charts = true;

				break;

			case 2:
				tab = 'Analytics';
				// this._helper.onSelectAnalyticsTab.emit();
				this.monthly_chart_updating = true;
				this.daily_chart_updating = true;

				if (this.current_display_mode == 'monthly') {
					this.getContentReport_monthly(this._date.transform(this.queried_date, 'y-MM-dd'));
				} else if(this.current_display_mode == 'daily') {
					this.getContentReport_daily(this._date.transform(this.queried_date, 'y-MM-dd'));
				} else {
					this.getContentReport_monthly(this._date.transform(this.queried_date, 'y-MM-dd'));
				}
				break;

			default:
				tab = 'Details';
				this.destroy_monthly_charts = true;
				this.destroy_daily_charts = true;
		}

		this.current_tab = tab;
		this._helper.singleLicensePageCurrentTab = tab;

	}

	updateLicenseAlias(): void {
		const filter = { licenseId: this.license_data.licenseId, alias: this.f.alias.value };

		this.subscriptions.add(
			this._license.update_alias(filter).subscribe(
				() => {
					this.openConfirmationModal('success', 'Success!', 'License Alias changed succesfully');
					this.activateEdit(false);
				},
				error => console.log('Error updating license alias', error)
			)
		);
	}

	zoneSelected(name: string): void {

		this.breakdownContents();
		this.breakdownDuration();
		this.updateCharts();
		this.selected_zone_index = this.content_per_zone.findIndex(content => content.zone_name === name);

		if (this.selected_zone_index === -1) {
			this.screen_zone = { playlistName: 'No Playlist', playlistId: null, zone: name };
			this.has_playlist = false;
			return;
		}

		const selectedZone = this.content_per_zone.filter(content => content.zone_name === name)[0];
		this.number_of_contents = this.content_per_zone[this.selected_zone_index].contents.length;

		const { zone_order, zone_name, playlist_name, playlist_id } = selectedZone;
		this.zone_order = zone_order;
		this.screen_zone = { playlistName: playlist_name, playlistId: playlist_id, zone: zone_name };
		this.playlist_route = `/${this.routes}/playlists/${playlist_id}`;
		this.has_playlist = true;

	} 

	// ==== START: Socket Dependent Events ====== //

	checkPiStatus(): void {
		this.status_check_disabled = true;
		setTimeout(() => {
			this.status_check_disabled = false;
		}, 2000);
		this.socket_piPlayerStatus();
	}

	checkDisplayStatus(): void {
		this._socket.emit('D_is_monitor_on', this.license_id);
	}

	internetSpeedTest(): void {
		this.speedtest_running = true;
		this._socket.emit('D_speed_test', this.license_id);
	}

	pushUpdate(): void {
		this.warningModal('warning', 'Push Updates', 'Are you sure you want to push updates?', 'Click OK to push updates for this license', 'update');
	}

	refetchPi(): void {
		this.warningModal('warning', 'Refetch Content', 'This will refetch all Player Data', 'Click OK to launch refetch', 'refetch');
	}

	resetPi(): void {
		this.warningModal('warning', 'Reset License', 'This will clear all player data including the license', 'Click OK to launch reset', 'reset');
	}

	restartAnydesk() {
		this._socket.emit('D_restart_anydesk', this.license_id);
		this.anydesk_restarting = true;
	}

	restartPi(): void {
		this.warningModal('warning', 'Restart Pi', 'Are you sure you want to restart the pi?', 'Click OK to restart this license', 'pi_restart');
	}

	restartPlayer(): void {
		this.warningModal('warning', 'Restart Player', 'Restart the software not the device itself?', 'Click OK to restart player of this license', 'player_restart');
	}

	screenShotPi(): void {
		this.screenshot_timeout = true;
		this.screenshot_message = "Taking Screenshot, Please wait. . .";
		this._socket.emit('D_screenshot_pi', this.license_id);
		setTimeout(() => {
			this.getScreenshots(this.license_id);
		}, 15000);
	}

	socket_screenShotFailed(): void {
		this._socket.on('SS_screenshot_failed', data => {
			if (this.license_id === data) {
				setTimeout(() => {
					this.displayPopup("Screenshot error! There's a problem getting a screenshot with this license", 'error');
					this.screenshot_timeout = false;
				}, 2000);
			}
		});
	}

	socket_updateCompleted(): void {
		this._socket.on('SS_update_finish', data => {
			if (this.license_id === data) {
				this.displayPopup("Player updated! This license/player has been updated succesfully");
				this.update_btn = 'Content Update';
				this.pi_updating = false;
				this.pi_status = true;
				this.player_status = true;
			}
		});
	}

	socket_screenShotSuccess(): void {
		this._socket.on('SS_screenshot_success', data => {
			if (this.license_id === data) {
				setTimeout(() => {
					this.displayPopup('Screenshot Success, Getting Screenshots...');
					this.screenshot_message = "Screenshot Success, Getting Screenshots . . ."
					this.getScreenshots(data);
				}, 2000)
			}
		});
	}

	socket_speedtestSuccess(): void {
		this._socket.on('SS_speed_test_success', data => {
			const { license_id, pingLatency, downloadMbps, uploadMbps, date, status } = data;

			if (this.license_id === license_id) {
				this.internet_connection.downloadMbps = `${downloadMbps.toFixed(2)} Mbps`;
				this.internet_connection.uploadMbps = `${uploadMbps.toFixed(2)} Mbps`;
				this.internet_connection.ping = `${pingLatency.toFixed(2)} ms`;
				this.internet_connection.date = date;
				this.license_data.internetSpeed = downloadMbps > 7 ? 'Good' : 'Slow';
				this.speedtest_running = false;
			
				this._license.update_internet_info(
					{
						licenseId: this.license_id,
						internetInfo: JSON.stringify({
							downloadMbps: downloadMbps,
							uploadMbps: uploadMbps,
							ping: pingLatency,
							date: date
						}),
					}
				).subscribe(
					data => console.log(data),
					error => console.log(error)
				)
			}
		})
	}

	socket_licenseOffline(): void {
		this._socket.on('SS_license_is_offline', data => {
			if(this.license_id === data) {
				this.pi_status = false;
			}
		});
	}

	socket_licenseOnline(): void {
		this._socket.on('SS_online_pi', data => {
			if(this.license_id === data) {
				this.pi_status = true;
			}
		})
	}

	socket_piPlayerStatus(): void {
		this._socket.emit('D_is_electron_running', this.license_id);
		this._socket.on('SS_electron_is_running', (data) => {
			if(this.license_id === data) {
				this.pi_status = true;
				this.player_status = true;
				console.log('ONLINE!')
			}
		});
	}

	socket_getAnydeskID(): void {
		this._socket.emit('D_anydesk_id', this.license_id);
		this._socket.on('SS_anydesk_id_result', data => {
			if(this.license_id === data.license_id) {
				this.anydesk_id = data.anydesk;
				this.anydesk_restarting = false;
			}
		});
	}

	socket_deadUI(): void {
		this._socket.on('SS_ui_is_dead', data => {
			if (this.license_id === data) {
				this.player_status = false;
			}
		})
	}

	updateAndRestart(): void {
		this.warningModal('warning', 'Update System and Restart', 'Are you sure you want to update the player and restart the pi?', 'Click OK to update this license', 'system_update');
	}

	upgradeToV2(): void {
		this.warningModal('warning', 'Update System to Version 2 and Restart', 'Are you sure you want to upgrade the software to version 2 and restart the pi?', 'Click OK to upgrade', 'system_upgrade');
	}

	// ==== END: Socket Dependent Events ====== //

	private adjustMinimapWidth(): void {
		
		if (window.innerWidth <= 1039) {
			this.minimap_width = '100%';
		} else {
			this.minimap_width = '300px';
		}

	}

	private breakdownContents(): void {
		const breakdown = { hosts: 0, advertisers: 0, fillers: 0, feeds: 0, others: 0 };
		const zone = this.content_per_zone.filter(zone => zone.zone_name === this.current_zone_name_selected)[0];

		if (!zone || !zone.contents || zone.contents.length <= 0) {
			this.assets_breakdown = breakdown;
			return
		}

		const contents: UI_CONTENT[] = zone.contents;

		contents.forEach(content => {
			const { advertiser_id, classification, file_type, host_id } = content;

			if (file_type === 'feed') {

				if (classification && classification === 'filler') breakdown.fillers++;
				else breakdown.feeds++;

			} else {

				if (this.isBlank(advertiser_id) && this.isBlank(host_id)) breakdown.others++;
				if (!this.isBlank(advertiser_id) && this.isBlank(host_id)) breakdown.advertisers++;
				if (!this.isBlank(host_id) && this.isBlank(advertiser_id)) breakdown.hosts++;

			}
		});

		this.assets_breakdown = breakdown;

	}

	private breakdownDuration(): void {
		const breakdown = { hosts: 0, advertisers: 0, fillers: 0, feeds: 0, others: 0, total: 0 };
		const zone = this.content_per_zone.filter(zone => zone.zone_name === this.current_zone_name_selected)[0];

		if (!zone || !zone.contents || zone.contents.length <= 0) {
			this.assets_breakdown = breakdown;
			return
		}

		const contents: UI_CONTENT[] = zone.contents;

		contents.forEach(content => {
			const { advertiser_id, classification, file_type, host_id, duration } = content;

			if (file_type === 'feed') {

				if (classification && classification === 'filler') breakdown.fillers += duration;
				else breakdown.feeds += duration;

			} else {

				if (this.isBlank(advertiser_id) && this.isBlank(host_id)) breakdown.others += duration;
				if (!this.isBlank(advertiser_id) && this.isBlank(host_id)) breakdown.advertisers += duration;
				if (!this.isBlank(host_id) && this.isBlank(advertiser_id)) breakdown.hosts += duration;

			}

			breakdown.total += duration;

		});

		this.duration_breakdown = breakdown;

		Object.entries(breakdown).forEach(
			([key, value]) => {
				this.duration_breakdown_text[key] = this.calculateTime(value);
			}
		);
		
	}

	private calculateTime(duration: number): string {

		if (duration < 60) {
			return `${Math.round(duration)}s`;
		}

		if (duration === 60) {
			return '1m';
		}

		const minutes = Math.floor(duration / 60);
		const seconds = Math.round(duration - minutes * 60);

		return `${minutes}m ${seconds}s`;

	}

	private destroyCharts(): void {
		if (this.charts.length <= 0) return;
		this.charts.forEach(chart => chart.destroy());
		this.charts = [];
	}

	// private emitReloadMedia(): void {
	// 	this.eventsSubject.next();
	// 	this.monthSelected(this.default_selected_month)
	// }

	private getHostTimezoneDay(): string {
		let result: string;
		let timezone: string;
		const defaultTimezone = 'US/Central';
		timezone = this.host.timeZone ? this.host.timeZone : defaultTimezone;
		result = moment.tz(timezone).format('dddd');
		if (!result) result = moment.tz(defaultTimezone).format('dddd');
		return result;
	}

	private getTemplateData(id: string): void {
		const get = this._template.get_template_by_id(id)
			.subscribe(
				(response: API_TEMPLATE[]) => {
					get.unsubscribe();

					if (response.length <= 0) return;

					let selectedZone;
					let selectedZoneName;
					this.template_data = response[0];
					const zones = response[0].templateZones;
					this.subscribeToZoneSelect();

					const backgroundZoneIndex = zones.findIndex(zone => zone.name === 'Background'); 

					if (backgroundZoneIndex > -1) {
						selectedZoneName = 'Background';
						selectedZone = this.content_per_zone.filter(content => content.zone_name === 'Background')[0];
						this.has_background_zone = true;
					} else {
						selectedZoneName = response[0].templateZones[0].name;
						selectedZone = this.content_per_zone[0];
						this.has_background_zone = false;
					}

					this.current_zone_name_selected = selectedZoneName;

					this.screen_zone = {
						playlistName : selectedZone.playlist_name,
						playlistId: selectedZone.playlist_id,
						zone: selectedZone.zone_name,
					};

					if (!this.has_background_zone) {
						this._template.onSelectZone.emit(selectedZoneName);
					}

				}, 
				error => console.log('Error retrieving template data', error)
			);
	}

	private generateAssetsBreakdownChart(): void {
		const breakdown = this.assets_breakdown;
		const { advertisers, feeds, fillers, hosts, others } = breakdown;
		const labels = [ `Hosts: ${hosts}`, `Advertisers: ${advertisers}`, `Fillers: ${fillers}`, `Feeds: ${feeds}`, `Others: ${others}` ];
		const data = [ hosts, advertisers, fillers, feeds, others ];
		const currentZone = this.screen_zone ? this.screen_zone.zone : this.content_per_zone[0].zone_name;
		const description = `${currentZone} Zone: ${this.number_of_contents} items`;
		const title = [ 'Assets Breakdown', description ];
		const canvas = document.getElementById('assetsBreakdown') as HTMLCanvasElement;

		// colors
		const hostColor = { background: 'rgba(215, 39, 39, 0.8)', border: 'rgba(215, 39, 39, 1)' };
		const advertiserColor = { background: 'rgba(147, 103, 188, 0.8)', border: 'rgba(147, 103, 188, 1)' };
		const fillerColor = { background: 'rgba(31, 119, 182, 0.8)', border: 'rgba(31, 119, 182, 1)' };
		const feedColor = { background: 'rgba(254, 128, 12, 0.8)', border: 'rgba(254, 128, 12, 1)' };
		const otherColor = { background: 'rgba(43, 160, 43, 0.8)', border: 'rgba(43, 160, 43, 1)' };
		const backgroundColor = [ hostColor.background, advertiserColor.background, fillerColor.background, feedColor.border, otherColor.background ];
		const borderColor = [ hostColor.border, advertiserColor.border, fillerColor.border, feedColor.border, otherColor.border ];

		const chart = new Chart(canvas, {
			type: 'doughnut',
			data: { labels, datasets: [{ data, backgroundColor, borderColor, }], },
			options: {
				tooltips: { enabled: false },
				title: { text: title, display: true },
				legend: { labels: { boxWidth: 12 }, position: 'right', align: 'center' },
				responsive: false,
				maintainAspectRatio: false
			}
		});

		this.charts.push(chart);

	}

	private generateDurationBreakdownChart(): void {

		const breakdown = this.duration_breakdown;
		const { advertisers, feeds, fillers, hosts, others } = breakdown;

		const labels = [
			`Hosts: ${this.calculateTime(hosts)}`,
			`Advertisers: ${this.calculateTime(advertisers)}`,
			`Fillers: ${this.calculateTime(fillers)}`, 
			`Feeds: ${this.calculateTime(fillers)}`,
			`Others: ${this.calculateTime(others)}` 
		];

		let data = [ hosts, advertisers, fillers, feeds, others ];
		data = data.map(time => Math.round(time));
		const description = `Total playtime: ${this.duration_breakdown_text.total}`;
		const title = [ 'Duration Breakdown', description ];
		const canvas = document.getElementById('durationBreakdown') as HTMLCanvasElement;

		// colors
		const hostColor = { background: 'rgba(215, 39, 39, 0.8)', border: 'rgba(215, 39, 39, 1)' };
		const advertiserColor = { background: 'rgba(147, 103, 188, 0.8)', border: 'rgba(147, 103, 188, 1)' };
		const fillerColor = { background: 'rgba(31, 119, 182, 0.8)', border: 'rgba(31, 119, 182, 1)' };
		const feedColor = { background: 'rgba(254, 128, 12, 0.8)', border: 'rgba(254, 128, 12, 1)' };
		const otherColor = { background: 'rgba(43, 160, 43, 0.8)', border: 'rgba(43, 160, 43, 1)' };
		const backgroundColor = [ hostColor.background, advertiserColor.background, fillerColor.background, feedColor.border, otherColor.background ];
		const borderColor = [ hostColor.border, advertiserColor.border, fillerColor.border, feedColor.border, otherColor.border ];

		const chart = new Chart(canvas, {
			type: 'doughnut',
			data: { labels, datasets: [{ data, backgroundColor, borderColor, }], },
			options: {
				tooltips: { enabled: false },
				title: { text: title, display: true },
				legend: { labels: { boxWidth: 12 }, position: 'right', align: 'center' },
				responsive: false,
				maintainAspectRatio: false
			}
		});

		this.charts.push(chart);

	}

	private isBlank(value: string): boolean {
		return !value || value.trim().length <= 0;
	}

	private mapPlaylistContentToUI(data: API_CONTENT[]): UI_CONTENT[] {

		const content = data.map(
			(c: API_CONTENT) => {
				return new UI_CONTENT(
					c.playlistContentId,
					c.createdBy,
					c.contentId,
					c.createdByName,
					c.dealerId,
					c.duration,
					c.hostId,
					c.advertiserId,
					c.fileName,
					c.url,
					c.fileType,
					c.handlerId,
					c.dateCreated,
					c.isFullScreen,
					c.filesize,
					c.thumbnail,
					c.isActive,
					c.isConverted,
					c.uuid,
					c.title,
					c.playlistContentSchedule,
					c.uploaded_by,
					c.classification
				)
			}
		);

		return content.filter(content => {

			if (content.playlist_content_schedule) {
				const schedule = content.playlist_content_schedule;
				return schedule && schedule.type === 1 || (schedule.type === 3 && !moment().isAfter(moment(schedule.to)));
			}

		});
	}

	private mapScreenLicenseToUI(data): UI_SCREEN_LICENSE[] {
		let counter = 1;
		return data.map(
			(l: API_LICENSE_PROPS) => {
				return new UI_SCREEN_LICENSE(
					l.licenseId,
					counter++,
					l.licenseKey,
					l.alias,
					l.internetType,
					l.internetSpeed,
					l.isActivated,
					l.isRegistered
				)
			}
		);
	}

	private mapScreenToUI(data: API_SINGLE_SCREEN): UI_SINGLE_SCREEN {
		return new UI_SINGLE_SCREEN (
			data.screen.screenId,
			data.screen.screenName,
			data.screen.description,
			data.dealer.dealerId,
			data.dealer.businessName,
			(data.host.hostId != null) ? data.host.hostId : 'Test',
			(data.host.name != null) ? data.host.name : '',
			(data.template.templateId != null) ? data.template.templateId : '',
			(data.template.name != null) ? data.template.name : '',
			`${data.createdBy.firstName} ${data.createdBy.lastName}`,
			'test',
			this.mapScreenZoneToUI(data.screenZonePlaylistsContents),
			this.mapScreenLicenseToUI(data.licenses)
		);
	}

	private mapScreenZoneToUI(data: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[]): UI_SCREEN_ZONE_PLAYLIST[] {
		return data.map(
			(s: API_SCREEN_ZONE_PLAYLISTS_CONTENTS) => {
				return new UI_SCREEN_ZONE_PLAYLIST(
					this.mapZonePlaylistToUI(s.screenTemplateZonePlaylist),
					this.mapPlaylistContentToUI(s.contents)
				);
			}
		);
	}

	private mapZoneContentToUI(data: any[]): UI_CONTENT_PER_ZONE[] {
		if (data) {
			return data.sort(
				(a, b) => {
					return a.screenTemplateZonePlaylist.order.toString().localeCompare(b.screenTemplateZonePlaylist.order)
				}
			).map(
				(i: any) => {
					this.contents_array.push(i.contents.length);
					return new UI_CONTENT_PER_ZONE(
						i.screenTemplateZonePlaylist.name,
						i.screenTemplateZonePlaylist.order,
						this.mapPlaylistContentToUI(i.contents),
						i.screenTemplateZonePlaylist.playlistName,
						i.screenTemplateZonePlaylist.playlistId,
					)
				}
			);
		}
	}

	private mapZonePlaylistToUI(data: API_SCREEN_TEMPLATE_ZONE): UI_ZONE_PLAYLIST {
		return new UI_ZONE_PLAYLIST(
			data.screenId,
			data.templateId,
			data.templateZoneId,
			data.xPos,
			data.yPos,
			data.height,
			data.width,
			data.playlistId,
			data.playlistName,
			data.name,
			data.description,
			data.order
		);
	}

	private setBusinessHours(data: UI_OPERATION_DAYS[]): { day: string, periods: string[], selected: boolean }[] {

		let result: { day: string, periods: string[], selected: boolean }[] = [];
		const timezoneDay = this.getHostTimezoneDay();

		data.forEach(
			(operation, index) => {

				result.push({ day: operation.day, periods: [], selected: operation.day === timezoneDay ? true : false });

				if (!operation.periods || !operation.status) result[index].periods.push('CLOSED');

				else 
					result[index].periods = operation.periods.map(period => {
						if (!period.open && !period.close) return 'Open 24 hours';
						return `${period.open} - ${period.close}` 
					});
				
				if (operation.day === timezoneDay) this.current_operation = { day: result[index].day, period: result[index].periods[0] };
			}
		);

		return result;
		
	}

	private setHostDetails(data: API_HOST): void {
		this.host = data;
		this.business_hours = this.setBusinessHours(JSON.parse(data.storeHours));
		this.host_notes = this.setNotes(data.notes);
	}

	private setNotes(data: string): string {
		let result = '';
		if (!data) return result;
		result = data.substr(0, 235);
		if (data.length > 235) result += '...';
		return result;
	}

	private setPlaylists(data: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[]): void {
		this.zone_playlists = [];

		const zonePlaylists = data.map(
			contents => {
				const { screenId, description, height, name, order, playlistId, playlistName, templateId, width, xPos, yPos } = contents.screenTemplateZonePlaylist;				
				const playlist = new UI_ZONE_PLAYLIST(screenId, templateId, '', xPos, yPos, height, width, playlistId, playlistName, name, description, order);
				playlist.link = `/${this.routes}/playlists/${playlistId}`;
				return playlist;
			}
		);

		this.setPlaylistOrder(zonePlaylists);
	}

	private setPlaylistOrder(data: UI_ZONE_PLAYLIST[]): void {
		const background = data.filter(x => x.name === 'Background')[0];
		const main = data.filter(x => x.name === 'Main')[0];
		const vertical = data.filter(x => x.name === 'Vertical')[0];
		const horizontal = data.filter(x => x.name === 'Horizontal')[0];

		if (background) this.zone_playlists.push(background);
		if (main) this.zone_playlists.push(main);
		if (vertical) this.zone_playlists.push(vertical);
		if (horizontal) this.zone_playlists.push(horizontal);
	}

	private setStorageCapacity(freeStorage: string, totalStorage: string ): void {

		if (!freeStorage || !totalStorage) {
			this.storage_capacity = '';
			return;
		}

		const total = parseInt(totalStorage.split(' ')[0]);
		const free = ((parseInt(freeStorage.split('%')[0]) * 0.01) * total).toFixed(2);
		this.storage_capacity = `${free} GB free of ${total} GB`;

	}

	private showInformationModal(width: string, height: string, title: string, contents: any, type: string, character_limit?: number): void {
		this._dialog.open(InformationModalComponent, {
			width: width,
			height: height,
			data: { title, contents, type, character_limit },
			panelClass: 'information-modal',
			autoFocus: false		
		});
	}

	private subscribeToZoneSelect(): void {
		this.subscriptions.add(
			this._template.onSelectZone.subscribe(
				(name: string) => {

					if (name === this.current_zone_name_selected) {
						console.log('Same zone selected!');
						return;
					}

					console.log('Zone selected!');
					this.current_zone_name_selected = name;
					this.zoneSelected(name);
					if (name === 'Background') this.background_zone_selected = true;
					else this.background_zone_selected = false;
				},
				error => console.log('Error selecting zone', error)
			)
		);
	}

	private updateCharts(): void {
		
		setTimeout(() => {
			this.updateAssetsChart();
			this.updateDurationChart();
		}, 1000);

	}

	private updateAssetsChart(): void {
		const config = { duration: 800, easing: 'easeOutBounce' };
		const chart = this.charts.filter(chart => chart.canvas.id === 'assetsBreakdown')[0];
		const { advertisers, feeds, fillers, hosts, others } = this.assets_breakdown;
		
		const currentZone = this.screen_zone ? this.screen_zone.zone : this.content_per_zone[0].zone_name;
		const description = `${currentZone} Zone: ${this.number_of_contents} items`;
		const title = [ 'Assets Breakdown', description ];

		chart.options.title.text = title;

		chart.data.labels = [ 
			`Hosts: ${hosts}`, 
			`Advertisers: ${advertisers}`, 
			`Fillers: ${fillers}`, 
			`Feeds: ${feeds}`, 
			`Others: ${others}` 
		];

		chart.data.datasets[0].data = [ hosts, advertisers, fillers, feeds, others ];
		chart.update(config);
	}

	private updateDurationChart(): void {
		const config = { duration: 800, easing: 'easeOutBounce' };
		const chart = this.charts.filter(chart => chart.canvas.id === 'durationBreakdown')[0];
		const { advertisers, feeds, fillers, hosts, others } = this.duration_breakdown;
		const description = `Total playtime: ${this.duration_breakdown_text.total}`;
		const title = [ 'Duration Breakdown', description ];

		chart.options.title.text = title;
		
		chart.data.labels = [
			`Hosts: ${this.calculateTime(hosts)}`,
			`Advertisers: ${this.calculateTime(advertisers)}`,
			`Fillers: ${this.calculateTime(fillers)}`, 
			`Feeds: ${this.calculateTime(fillers)}`,
			`Others: ${this.calculateTime(others)}` 
		];

		let data = [ hosts, advertisers, fillers, feeds, others ];
		data = data.map(time => Math.round(time));
		chart.data.datasets[0].data = data;
		chart.update(config);
	}

	private warningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
		this._dialog.closeAll();

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		dialogRef.afterClosed().subscribe(result => {

			if (result === 'reset') {

				this._socket.emit('D_reset_pi', this.license_id);
				this.pi_status = false;
				this.player_status = false;

			} else if(result === 'update') {

				this._socket.emit('D_update_player', this.license_id);
				this.pi_updating = true;
				this.update_btn = 'Updating...';

			} else if(result === 'refetch') {

				this._socket.emit('D_refetch_pi', this.license_id);
				this.pi_updating = true;
				this.update_btn = 'Ongoing Refetch';

			} else if(result === 'system_update') {

				this._socket.emit('D_system_update_by_license', this.license_id);
				this.pi_status = false;
				this.pi_updating = true;
				this.update_btn = 'Ongoing System Update';

			} else if(result === 'pi_restart') {

				this._socket.emit('D_pi_restart', this.license_id);
				this.pi_status = false;
				this.pi_updating = true;
				this.update_btn = 'Pi Restarting';

			} else if(result === 'player_restart') {

				this._socket.emit('D_player_restart', this.license_id);
				this.pi_status = false;
				this.pi_updating = true;
				this.update_btn = 'Player Restarting';

			} else if(result === 'system_upgrade') {

				this._socket.emit('D_upgrade_to_v2_by_license', this.license_id);
				this.pi_status = false;
				this.pi_updating = true;
				this.update_btn = 'Ongoing System Update';

			}

		});
	}

	submitTerminalCommand() {
		this.terminal_entered_scripts.push(this.terminal_value);

		this._socket.emit('D_run_terminal', {
			license_id: this.license_id,
			script: this.terminal_value
		});

 		this.terminal_value = undefined;
	}
}
