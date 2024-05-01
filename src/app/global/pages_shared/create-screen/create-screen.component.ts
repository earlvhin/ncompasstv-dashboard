import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
    API_DEALER,
    API_HOST,
    API_LICENSE_PROPS,
    API_TEMPLATE,
    API_ZONE,
    PAGING,
    UI_AUTOCOMPLETE,
} from 'src/app/global/models';
import {
    AuthService,
    HostService,
    LicenseService,
    PlaylistService,
    ScreenService,
    TemplateService,
} from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { EditableFieldModalComponent } from '../../components_shared/page_components/editable-field-modal/editable-field-modal.component';
import { ScreenCreatedModalComponent } from '../../components_shared/screen_components/screen-created-modal/screen-created-modal.component';
import { HOST_ACTIVITY_LOGS } from '../../models/api_host_activity_logs.model';

@Component({
    selector: 'app-create-screen',
    templateUrl: './create-screen.component.html',
    styleUrls: ['./create-screen.component.scss'],
})
export class CreateScreenComponent implements OnInit {
    assigned_licenses = [];
    creating_screen = false;
    dealer_name: string;
    dealerId: string;
    dealers_data: API_DEALER[] = [];
    dealers: API_DEALER[];
    disabledPublish = false;
    gettingHostLicenses = false;
    has_no_licenses = false;
    hosts: API_HOST[] = [];
    hostId: string;
    hostsData = [];
    hostDataByDealerId = [];
    initial_load = false;
    is_dealer = false;
    is_dealer_present: any;
    is_host_present: any;
    licenses: API_LICENSE_PROPS[];
    loading_data = true;
    loading_data_host = true;
    loading_playlist = true;
    loading_search = false;
    loading_search_host = false;
    newScreenFormView = this._createScreenFields;
    new_screen_form: FormGroup;
    no_chosen_template = true;
    no_playlist_data = false;
    paging_host: PAGING;
    paging: PAGING;
    playlist: any;
    reset_screen = false;
    screenId: string;
    screen_info_error = true;
    screen_selected: string = null;
    screen_types = [];
    screenType = [];
    screenTypeData: UI_AUTOCOMPLETE;
    searchDisabled = false;
    selectedDealer: any = [];
    slide_toggle_status = [];
    template$: Observable<API_TEMPLATE[]>;
    templates$: Observable<API_TEMPLATE[]>;
    title = 'Create Screen';
    zone_playlist_form: FormGroup;
    zone: string;

    private is_search = false;
    private search_dealer_data = '';
    private search_host_data = '';
    private queued_install_dates: { licenseId: string; installDate: string }[] = [];
    private selected_template_id: string;
    private selected_template_zones: any[];

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _host: HostService,
        private _license: LicenseService,
        private _param: ActivatedRoute,
        private _playlist: PlaylistService,
        private _router: Router,
        private _screen: ScreenService,
        private _template: TemplateService,
    ) {}

    ngOnInit() {
        this.new_screen_form = this._form.group({
            screen_name: ['', Validators.required],
            description: [''],
        });
        this.zone_playlist_form = this._form.group({ screenZonePlaylist: this._form.array([]) });

        this._param.queryParamMap.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
            if (data.get('dealer_id') && data.get('host_id')) {
                this.dealerId = data.get('dealer_id');
                this.hostId = data.get('host_id');
                this.getDealerById(this.dealerId);
                this.getPlaylistsByDealerId(this.dealerId);
                this.getHostsByDealerId(1);
                this.getHostById(this.hostId);
                this.getLicenseByHostId(this.hostId);
            }
        });

        this.new_screen_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe((f) => {
            if (
                this.dealerId != undefined &&
                this.new_screen_form.valid &&
                this.screen_selected != undefined &&
                this.new_screen_form.valid
            ) {
                this.screen_info_error = false;
            }
        });

        this.getScreenType();
        this.getDealers(1);
        this.getTemplates();

        if (this.isDealer) {
            this.searchDisabled = true;
            this.is_dealer = true;
            this.dealerId = this._auth.current_user_value.roleInfo.dealerId;
            this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
            this.setAssignedTo({ id: this.dealerId, value: this.dealer_name });

            this.selectedDealer.push({
                id: this._auth.current_user_value.roleInfo.dealerId,
                value: this._auth.current_user_value.roleInfo.businessName,
            });
        }
    }

    ngDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    addPlaylistButton() {
        const url = this._router.serializeUrl(
            this._router.createUrlTree([`/${this.roleRoute}/playlists/create-playlist`], {}),
        );
        window.open(url, '_blank');
    }

    addHostButton() {
        const url = this._router.serializeUrl(this._router.createUrlTree([`/${this.roleRoute}/hosts/create-host`], {}));
        window.open(url, '_blank');
    }

    checkIfStep1Complete() {
        if (
            this.dealerId != undefined &&
            this.new_screen_form.valid &&
            this.screen_selected != undefined &&
            this.new_screen_form.valid
        ) {
            this.screen_info_error = false;
        } else {
            this.screen_info_error = true;
        }
    }

    clearScreenType(): void {
        this.screen_selected = null;
        this.reset_screen = true;
    }

    dealerSearchBoxTrigger(event: { is_search: boolean; page: number }): void {
        this.is_search = event.is_search;
        if (this.is_search) this.search_dealer_data = '';
        this.getDealers(event.page);
    }

    getTemplateById(id: string): void {
        this.no_chosen_template = false;
        this.selected_template_id = id;
        this.zone_playlist_form = this._form.group({ screenZonePlaylist: this._form.array([]) });
        this.selected_template_zones = [];
        this.template$ = this._template.get_template_by_id(id);

        this.template$.pipe(takeUntil(this._unsubscribe)).subscribe(
            (data: API_TEMPLATE[]) => {
                data.forEach((t) => {
                    t.templateZones.forEach((z) => {
                        this.selected_template_zones.push(z);
                        this.zonePlaylistForm(z);
                    });
                });
            },
            (error) => {
                console.error(error);
            },
        );
    }

    hostSearchBoxTrigger(event: { is_search: boolean; page: number }): void {
        this.is_search = event.is_search;
        if (this.is_search) this.search_host_data = '';
        this.getHostsByDealerId(event.page);
    }

    licenseSelected(status: boolean, licenseId: string, index: number): void {
        if (status) {
            this.assigned_licenses.push(licenseId);

            return;
        }

        const assignedIndex = this.assigned_licenses.indexOf(licenseId);
        const queuedIndex = this.queued_install_dates.findIndex((license) => license.licenseId === licenseId);

        this.assigned_licenses.splice(assignedIndex, 1);
        this.queued_install_dates.splice(queuedIndex, 1);
        this.licenses[index].installDate = null;
    }

    onBulkSetInstallDate(): void {
        this.onSetInstallDate('', '', null, true);
    }

    onSetInstallDate(licenseId: string, installDate: string, index = null, multiple = false): void {
        if (!this.assigned_licenses.includes(licenseId) && !multiple) return;

        const label = !multiple ? 'Installation Date' : 'Bulk Installation Date';
        const message = label;
        const width = '350px';
        const dialogParams: any = {
            width,
            data: { status: { label, dropdown_edit: false }, message, data: installDate },
        };
        const dialog = this._dialog.open(EditableFieldModalComponent, dialogParams);

        const close = dialog.afterClosed().subscribe(
            (date) => {
                close.unsubscribe();

                if (!date || typeof date === 'undefined' || date.trim().length <= 0) return;

                const queued = this.queued_install_dates;
                const queuedLicenseIds = queued.map((license) => license.licenseId);

                if (multiple) {
                    const selected = this.assigned_licenses;

                    selected.forEach((id) => {
                        let data = { licenseId: id, installDate: date };
                        const idNotQueued = !queuedLicenseIds.includes(id);

                        if (idNotQueued) this.queued_install_dates.push(data);

                        const index = this.licenses.findIndex((license) => license.licenseId === id && idNotQueued);

                        if (index !== -1) this.licenses[index].installDate = date;
                    });

                    return;
                }

                const data = { licenseId, installDate: date };

                if (queuedLicenseIds.includes(licenseId)) {
                    const indexToReplace = this.queued_install_dates.findIndex((date) => date.licenseId === licenseId);
                    this.queued_install_dates[indexToReplace] = data;
                } else {
                    this.queued_install_dates.push(data);
                }

                this.licenses[index].installDate = date;
            },
            (error) => {
                console.error(error);
            },
        );
    }

    publishScreen(): void {
        if (this.hasUnusedLicenseWithoutInstallDate) {
            this.openErrorDialog();
            return;
        }

        let screen_licenses = [];
        let zone_playlist_data_trim = [];
        const zone_playlist_data = this.zone_playlist_form.get('screenZonePlaylist').value;
        this.creating_screen = true;

        zone_playlist_data.forEach((data) => {
            const zone_playlist = {
                templateId: data.templateId,
                templateZoneId: data.templateZoneId,
                playlistId: data.zonePlaylist,
            };

            zone_playlist_data_trim.push(zone_playlist);
        });

        this.assigned_licenses.forEach((l) => {
            const license = { licenseId: l };
            screen_licenses.push(license);
        });

        // Structuring data to be sent
        const created_screen = {
            screen: {
                screenName: this.new_screen_form_controls.screen_name.value,
                description: this.new_screen_form_controls.description.value,
                screenTypeId: this.screen_selected,
                dealerid: this.dealerId,
                hostid: this.hostId,
                templateid: this.selected_template_id,
                createdby: this._auth.current_user_value.user_id,
            },
            screenZonePlaylists: zone_playlist_data_trim,
            licenses: screen_licenses,
        };

        const newHostActivityLog = new HOST_ACTIVITY_LOGS(
            this.hostId,
            'create_screen',
            this._auth.current_user_value.user_id,
        );

        if (this.creating_screen) {
            // if installation dates are set
            if (this.queued_install_dates.length > 0) {
                const publish = {
                    screen: this._screen.create_screen(created_screen),
                    install_dates: this._license.update_install_date_list(this.queued_install_dates),
                };

                forkJoin([publish.screen, publish.install_dates])
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        (response) => {
                            this.screenId = response[0].screenId;
                            this.openCreateScreenDialog();
                            this.creating_screen = false;
                        },
                        (error) => {
                            console.error(error);
                        },
                    );

                return;
            }

            this._screen
                .create_screen(created_screen)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (response) => {
                        this.screenId = response.screenId;
                        this.openCreateScreenDialog();
                        this.creating_screen = false;
                    },
                    (error) => {
                        console.error(error);
                    },
                );

            this._host
                .create_host_activity_logs(newHostActivityLog)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (data) => {
                        return data;
                    },
                    (error) => {
                        console.error(error);
                    },
                );
        }
    }

    searchBoxTrigger(event: { is_search: boolean; page: number }): void {
        this.is_search = event.is_search;
        this.getDealers(event.page);
    }

    searchData(page: number): void {
        this.loading_search = true;

        this._dealer
            .get_search_dealer(page)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    if (data.paging.entities.length > 0) {
                        this.dealers = data.paging.entities;
                        this.dealers_data = data.paging.entities;
                        this.loading_search = false;
                    } else {
                        this.dealers_data = [];
                        this.loading_search = false;
                    }
                    this.paging = data.paging;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    searchDealerData(keyword: string): void {
        this.search_dealer_data = keyword;
        this.getDealers(1);
    }

    searchHostData(keyword: string): void {
        this.search_host_data = keyword;
        this.getHostsByDealerId(1);
    }

    setScreenType(type: { id: string; value: string }): void {
        this.screen_selected = type.id;
        this.reset_screen = false;
    }

    setAssignedTo(data: { id: string; value: string; dealerId?: string }): void {
        if (data === null) {
            this.disabledPublish = true;
            return;
        }

        /**
         * dealerId is given when a host has been selected,
         * if not then it means a dealer has been selected
         */
        if (!data.dealerId) this.dealerId = data.id;
        this.getPlaylistsByDealerId(this.dealerId);
        this.getHostsByDealerId(1);
        this.setToDealerOrHost(data);
    }

    setToDealerOrHost(data: { id: string; value: string; dealerId?: string }) {
        if (data === null || !data.dealerId) {
            this.disabledPublish = true;
            return;
        }

        /**
         * The previous implementation where this.hostsData gets checked is no longer reliable,
         * instead, we're using the response from the host autocomplete component which carries a
         * dealerId if a host has been selected.
         */
        if (data.dealerId) {
            this.disabledPublish = false;
            this.hostId = data.id;
            this.getLicenseByHostId(data.id);
        }
    }

    private get new_screen_form_controls() {
        return this.new_screen_form.controls;
    }

    private getDealerById(id: string): void {
        this._dealer
            .get_dealer_by_id(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: API_DEALER) => {
                    this.is_dealer_present = { id: data.dealerId, name: data.businessName };
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getDealers(page: number): void {
        this.loading_data = true;

        if (page > 1) {
            this._dealer
                .get_dealers_with_page(page, '')
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (data) => {
                        data.dealers.map((dealer) => this.dealers.push(dealer));
                        this.paging = data.paging;
                        this.loading_data = false;
                    },
                    (error) => {
                        this.loading_data = false;
                    },
                );
        } else {
            if (this.is_search || this.search_dealer_data != '') {
                this.loading_search = true;
            }

            this._dealer
                .get_dealers_with_page(page, '')
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (data) => {
                        this.dealers = data.dealers;
                        this.paging = data.paging;
                        this.loading_data = false;
                        this.dealers_data = data.dealers;
                        this.loading_search = false;
                    },
                    (error) => {
                        this.loading_data = false;
                        this.loading_search = false;
                    },
                );
        }
    }

    private getHostsByDealerId(page: number): void {
        this.loading_data_host = true;

        if (page > 1) {
            this._host
                .get_host_by_dealer_id(this.dealerId, page, this.search_host_data)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (data) => {
                        data.paging.entities.map((i) => {
                            this.hosts.push(i);
                            this.hostsData.push(i);
                        });

                        this.paging_host = data.paging;
                        this.loading_data_host = false;
                    },
                    (error) => {
                        console.error(error);
                    },
                );
        } else {
            this.hostsData = [];
            this.initial_load = false;

            if (this.is_search || this.search_host_data != '') {
                this.loading_search_host = true;
            }

            this._host
                .get_host_by_dealer_id(this.dealerId, page, this.search_host_data)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (data) => {
                        if (!data.message) {
                            if (this.search_host_data == '') {
                                data.paging.entities.map((i) => {
                                    this.hosts.push(i);
                                    this.hostsData.push(i);

                                    this.hostDataByDealerId.push({ id: i.dealerId, value: i.name });
                                });
                            } else {
                                if (data.paging.entities.length > 0) {
                                    this.hostsData = data.paging.entities;
                                    this.loading_search = false;
                                }
                            }
                            this.paging_host = data.paging;
                        } else {
                            this.hostId = '';
                            if (this.search_host_data != '') {
                                this.hostsData = [];
                                this.loading_search = false;
                            }
                        }
                        this.loading_data_host = false;
                        this.loading_search_host = false;
                    },
                    (error) => {
                        console.error(error);
                    },
                );
        }
    }

    private getHostById(id: string) {
        this._host
            .get_host_by_id(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: any) => {
                    this.is_host_present = {
                        id: data.host.dealerId,
                        name: data.host.name,
                    };
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getLicenseByHostId(id: string): void {
        this.licenses = [];
        this.gettingHostLicenses = true;
        this._license
            .getLicensesByHostId(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if ('message' in response) {
                        this.has_no_licenses = true;
                        this.gettingHostLicenses = false;
                        return;
                    }

                    this.licenses = response;
                    this.has_no_licenses = false;
                    this.gettingHostLicenses = false;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getPlaylistsByDealerId(id: string): void {
        this.loading_playlist = true;
        this.no_playlist_data = false;

        this._playlist
            .getPlaylistByDealerIdMinified(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: any) => {
                    this.playlist = data;
                    this.loading_playlist = false;
                    if (this.playlist.message === 'No records found!') this.no_playlist_data = true;
                },
                (error) => {
                    this.loading_playlist = false;
                    this.no_playlist_data = true;
                },
            );
    }

    private getScreenType() {
        this._screen
            .get_screens_type()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this.screen_types = data;

                    this.screen_types.map((type) => {
                        this.screenType.push({ id: type.screenTypeId, value: type.description });
                    });

                    this.setAutocomplete();
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getTemplates() {
        this.templates$ = this._template.get_templates();
    }

    private zonePlaylistForm(data: API_ZONE): void {
        const zonesPlaylistForms = this.zone_playlist_form.get('screenZonePlaylist') as FormArray;
        zonesPlaylistForms.push(this.zonePlaylist(data));
    }

    private zonePlaylist(zone: API_ZONE): FormGroup {
        return new FormGroup({
            templateName: new FormControl(zone.name),
            templateId: new FormControl(this.selected_template_id),
            templateZoneId: new FormControl(zone.templateZoneId),
            zonePlaylist: new FormControl(),
        });
    }

    private openCreateScreenDialog(): void {
        const dialog = this._dialog.open(ScreenCreatedModalComponent, {
            disableClose: true,
            width: '600px',
            data: this.new_screen_form_controls.screen_name.value,
        });

        dialog.afterClosed().subscribe(() => {
            const url = [
                `/${this.roleRoute}/screens/${this.screenId}/${this.new_screen_form_controls.screen_name.value}`,
            ];
            this._router.navigate(url);
        });
    }

    private openErrorDialog() {
        const status = 'error';
        const message = 'Installation Dates Required';
        const data = 'Please make sure that licenses to be assigned have install dates';

        const config = {
            width: '500px',
            height: '350px',
            data: { status, message, data },
        };

        this._dialog.open(ConfirmationModalComponent, config);
    }

    private get hasUnusedLicenseWithoutInstallDate() {
        if (this.has_no_licenses) return false;
        return (
            typeof this.licenses.find(
                (license) => this.assigned_licenses.includes(license.licenseId) && !license.installDate,
            ) !== 'undefined'
        );
    }

    protected get _createScreenFields() {
        return [
            {
                label: 'Screen Name *',
                control: 'screen_name',
                width: 'col-lg-12',
                placeholder: 'Ex: This Screen Name',
            },
            {
                label: 'Description',
                control: 'description',
                width: 'col-lg-12',
                placeholder: 'Ex: Describe this Screen',
            },
        ];
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }

    protected get isDealer() {
        const DEALER_ROLES = ['dealer', 'sub-dealer'];
        return DEALER_ROLES.includes(this._auth.current_role);
    }

    public setAutocomplete() {
        this.screenTypeData = {
            label: 'Click to Select a Screen Type',
            placeholder: '',
            data: this.screenType,
            unselect: true,
        };
    }
}
