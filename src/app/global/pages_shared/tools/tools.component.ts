import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import * as moment from 'moment';
import { ToolsService } from '../../services/tools/tools.service';
import { GLOBAL_SETTINGS } from '../../models/api_global_settings.model';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { API_XML_DATA, EDITING_TOOLS } from 'src/app/global/models';

@Component({
    selector: 'app-tools',
    templateUrl: './tools.component.html',
    styleUrls: ['./tools.component.scss'],
})
export class ToolsComponent implements OnInit {
    activity_code_form: FormGroup;
    activities: any;
    global_settings_form: FormGroup;
    isEditing = false;
    isEditingOwner: string;
    isShowingMoreLoading = false;
    loading = false;
    page = 1;
    pageSize = 15;
    title: string = 'Administrative Tools';
    remote_update_disabled: boolean;
    remote_reboot_disabled: boolean;
    isShowMoreDisabled = false;
    sortColumn = 'dateCreated';
    sortOrder = 'desc';
    timeout_duration: number;
    timeout_message: string;
    terminal_entered_scripts: string[] = [];
    terminal_value: string;
    xmlTagsForm: FormGroup;
    xmlTagsData: API_XML_DATA[] = [];

    _socket: any;

    constructor(
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _tool: ToolsService,
        private _snackBar: MatSnackBar,
    ) {
        this._socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__ToolsComponent',
        });
    }

    ngOnInit() {
        this._socket.on('connect', () => {});

        this._socket.on('disconnect', () => {});

        this.activity_code_form = this._form.group({
            activityCode: ['', Validators.required],
            activityDescription: ['', Validators.required],
        });

        this.global_settings_form = this._form.group({
            vistarNetworkId: ['', Validators.required],
            vistarApiKey: ['', Validators.required],
        });

        this.xmlTagsForm = this._form.group({
            xmlTagName: ['', Validators.required],
        });

        this.disableTimeoutChecker();

        this.getActivityCode();
        this.getGlobalSettings();
        this.getAllXmlTag();
    }

    ngOnDestroy() {
        this._socket.disconnect();
    }

    disableTimeoutChecker() {
        const admin_tools_disabled = localStorage.getItem('admin_tools_disabled');

        if (admin_tools_disabled) {
            this.timeout_duration = moment().diff(moment(admin_tools_disabled, 'MMMM Do YYYY, h:mm:ss a'), 'minutes');

            if (this.timeout_duration >= 10) {
                this.remote_update_disabled = false;
                this.remote_reboot_disabled = false;
                localStorage.removeItem('admin_tools_disabled');
            } else {
                this.remote_update_disabled = true;
                this.remote_reboot_disabled = true;
            }

            this.timeout_message = `Will be available after ${10 - this.timeout_duration} minutes`;
        }
    }

    removeAllScreenshots() {
        this.warningModal(
            'warning',
            'Delete All Screenshots',
            'Are you sure you want to delete all screenshots?',
            '',
            'delete_screenshots',
        );
    }

    remoteUpdateAll() {
        this.warningModal('warning', 'Update and Reboot', 'Update and reboot all online players?', '', 'update_reboot');
    }

    remoteRebootAll() {
        this.warningModal(
            'warning',
            'Reboot Players',
            'Are you sure you want reboot all online players?',
            '',
            'reboot_only',
        );
    }

    remoteRunTerminal() {
        this.warningModal(
            'warning',
            'Run Script',
            'Are you sure you want to run this script to all players?',
            '',
            'run_script',
        );
    }

    renewSocket() {
        this.warningModal(
            'warning',
            'Renew Socket',
            'You are about to renew all socket connections?',
            '',
            'renew_socket',
        );
    }

    private warningModal(
        status: string,
        message: string,
        data: string,
        return_msg: string,
        action: string,
        id?: string,
    ): void {
        this._dialog.closeAll();

        let dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: {
                status: status,
                message: message,
                data: data,
                return_msg: return_msg,
                action: action,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                switch (result) {
                    case 'update_reboot':
                        this._socket.emit('D_system_update');
                        break;
                    case 'reboot_only':
                        this._socket.emit('D_system_reboot');
                        break;
                    case 'run_script':
                        this.terminal_entered_scripts.push(this.terminal_value);
                        this._socket.emit('D_run_script_to_all', this.terminal_value);
                        break;
                    case 'renew_socket':
                        this._tool.resetSocketConnection().subscribe((data) => (error) => {
                            console.error(error);
                        });
                        break;
                    case 'delete_screenshots':
                        this._tool.deleteScreenshots().subscribe((data) => (error) => {
                            console.error(error);
                        });
                        break;
                    case 'xml_delete':
                        this.onConfirmDeleteXmlTag(id);
                        break;
                    default:
                        break;
                }

                const now = moment().format('MMMM Do YYYY, h:mm:ss a');
                localStorage.setItem('admin_tools_disabled', `${now}`);
                this.timeout_duration = 0;
                this.timeout_message = `Will be available after ${10 - this.timeout_duration} minutes`;
                this.remote_reboot_disabled = true;
                this.remote_update_disabled = true;
            }
        });
    }

    getGlobalSettings() {
        this._tool.getGlobalSettings().subscribe((data) => {});
    }

    getActivityCode() {
        this._tool.getActivities().subscribe((data) => {
            this.activities = data;
            this.loading = false;
        });
    }

    saveActivity() {
        this._tool.createActivity(this.activity_code_form.value).subscribe(
            (data) => {
                this.activity_code_form.reset();

                this.loading = true;
                this.getActivityCode(); // Refresh the activity list
                this.onShowSnackBar('success', 'Activity created successfully');
            },
            (error) => {
                console.error('Error creating activity:', error);
                this.onShowSnackBar('error', 'Error creating activity');
            },
        );
    }

    public startEditing(data: EDITING_TOOLS, type: string): void {
        switch (type) {
            case 'edit_activity':
                data.editing = true;
                data.newDescription = data.activityDescription;
                break;
            case 'edit_xml':
                this.isEditing = true;
                this.isEditingOwner = data.id;

                //Refresh the input if it has been edited but not saved, then proceed to edit another tag name.
                this.getAllXmlTag();
            default:
                break;
        }
    }

    saveDescription(activity: any) {
        activity.activityDescription = activity.newDescription;
        activity.editing = false;

        this._tool
            .updateActivity(activity.activityCode, { activityDescription: activity.activityDescription })
            .subscribe(
                () => {
                    this.onShowSnackBar('success', 'Activity description updated successfully');
                },
                (error) => {
                    console.error('Error updating activity description:', error);
                    this.onShowSnackBar('error', 'Error updating activity description');
                },
            );
    }

    public cancelEditing(data: EDITING_TOOLS, type: string): void {
        switch (type) {
            case 'cancel_activity':
                data.editing = false;
                break;
            case 'cancel_xml':
                this.isEditing = false;
                this.getAllXmlTag();
                break;
            default:
                break;
        }
    }

    confirmDelete(activity: any) {
        const activityCode = activity.activityCode;
        const confirmDelete = confirm(`Are you sure you want to delete ${activityCode}?`);
        if (confirmDelete) {
            this.deleteActivity(activity);
        }
    }

    deleteActivity(activity: any) {
        const activityCode = activity.activityCode;
        this._tool.deleteActivity(activityCode).subscribe(
            () => {
                this.getActivityCode(); // Refresh activity list after deletion
                this.onShowSnackBar('error', `${activityCode} activity deleted successfully`);
            },
            (error) => {
                console.error('Error deleting activity:', error);
                this.onShowSnackBar('error', 'Error deleting activity');
            },
        );
    }

    //****** START XML TAGS

    public saveXmlTag(): void {
        this._tool.createXml({ name: this.xmlTagsForm.value.xmlTagName }).subscribe(
            () => {
                this.xmlTagsForm.reset();

                this.loading = true;
                this.getAllXmlTag();
                this.onShowSnackBar('success', 'XML Tag created successfully');
            },
            (error) => {
                console.error('Error creating XML tag', error);
                this.onShowSnackBar('error', 'XML Tag Already Exist!');
            },
        );
    }

    private getAllXmlTag(): void {
        this._tool.getAllXmlTag(this.sortColumn, this.sortOrder, this.page, this.pageSize).subscribe(
            (response) => {
                this.xmlTagsData = response.data.paging.entities;
                this.isShowMoreDisabled = response.data.paging.totalEntities < response.data.paging.pageSize;
                this.isShowingMoreLoading = false;
                this.loading = false;
            },
            (error) => {
                console.error('Error getting XML Tags', error);
            },
        );
    }

    public onSaveEditedXmlTag(a: API_XML_DATA): void {
        this._tool.updateXmlTag(a.id, { Name: a.name }).subscribe(
            () => {
                this.isEditing = false;
                this.onShowSnackBar('success', 'XML Tag edited successfully');
            },
            (error) => {
                console.error('Error editing XML Tag', error);
                this.onShowSnackBar('error', 'XML Tag Already Exist!');
            },
        );
    }

    public onDeleteXmlTag(id: string): void {
        this.warningModal(
            'warning',
            'Delete XML Tag',
            'Are you sure you want to delete this XML Tag?',
            '',
            'xml_delete',
            id,
        );
    }

    private onConfirmDeleteXmlTag(id: string): void {
        this._tool.deleteXmlTag(id).subscribe(
            () => {
                this.getAllXmlTag();
                this.onShowSnackBar('success', 'XML Tag deleted successfully');
                this.loading = true;
            },
            (error) => {
                console.error('Error deleting XML Tags', error);
            },
        );
    }

    public onShowMoreData(): void {
        this.isShowMoreDisabled = true;
        this.isShowingMoreLoading = true;

        setTimeout(() => {
            this.pageSize += 15;
            this.getAllXmlTag();
        }, 1000);
    }

    //****** END XML TAGS

    private onShowSnackBar(status: string, message: string): void {
        this._snackBar.open(message, 'Close', {
            duration: 5000,
            panelClass: [`snackbar-${status}`, 'custom-close-button'],
        });
    }
}
