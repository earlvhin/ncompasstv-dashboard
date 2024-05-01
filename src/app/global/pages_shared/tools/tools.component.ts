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

@Component({
    selector: 'app-tools',
    templateUrl: './tools.component.html',
    styleUrls: ['./tools.component.scss'],
})
export class ToolsComponent implements OnInit {
    activity_code_form: FormGroup;
    activities: any;
    global_settings_form: FormGroup;
    title: string = 'Administrative Tools';
    remote_update_disabled: boolean;
    remote_reboot_disabled: boolean;
    timeout_duration: number;
    timeout_message: string;
    terminal_entered_scripts: string[] = [];
    terminal_value: string;

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

        this.disableTimeoutChecker();

        this.getActivityCode();
        this.getGlobalSettings();
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

    warningModal(status, message, data, return_msg, action): void {
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
                if (result == 'update_reboot') {
                    this._socket.emit('D_system_update');
                } else if (result == 'reboot_only') {
                    this._socket.emit('D_system_reboot');
                } else if (result == 'run_script') {
                    this.terminal_entered_scripts.push(this.terminal_value);
                    this._socket.emit('D_run_script_to_all', this.terminal_value);
                } else if (result == 'renew_socket') {
                    this._tool.resetSocketConnection().subscribe((data) => (error) => {
                        console.error(error);
                    });
                } else if (result == 'delete_screenshots') {
                    this._tool.deleteScreenshots().subscribe((data) => (error) => {
                        console.error(error);
                    });
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
        });
    }

    saveActivity() {
        this._tool.createActivity(this.activity_code_form.value).subscribe(
            (data) => {
                this.activity_code_form.reset();
                this.activity_code_form.clearValidators();
                this.activity_code_form.updateValueAndValidity();

                this.getActivityCode(); // Refresh the activity list
                this._snackBar.open('Activity created successfully', 'Close', {
                    duration: 8000,
                    panelClass: ['snackbar-success', 'custom-close-button'],
                });
            },
            (error) => {
                console.error('Error creating activity:', error);
                this._snackBar.open('Error creating activity', 'Close', {
                    duration: 8000,
                    panelClass: ['snackbar-error', 'custom-close-button'],
                });
            },
        );
    }

    startEditing(activity: any) {
        activity.editing = true;
        activity.newDescription = activity.activityDescription;
    }

    saveDescription(activity: any) {
        activity.activityDescription = activity.newDescription;
        activity.editing = false;

        this._tool
            .updateActivity(activity.activityCode, { activityDescription: activity.activityDescription })
            .subscribe(
                () => {
                    this._snackBar.open('Activity description updated successfully', 'Close', {
                        duration: 8000,
                        panelClass: ['snackbar-success', 'custom-close-button'],
                    });
                },
                (error) => {
                    console.error('Error updating activity description:', error);
                    this._snackBar.open('Error updating activity description', 'Close', {
                        duration: 8000,
                        panelClass: ['snackbar-error', 'custom-close-button'],
                    });
                },
            );
    }

    cancelEditing(activity: any) {
        activity.editing = false;
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
                this._snackBar.open(`${activityCode} activity deleted successfully`, 'Close', {
                    duration: 8000,
                    panelClass: ['snackbar-error', 'custom-close-button'], // Change to success panel class
                });
            },
            (error) => {
                console.error('Error deleting activity:', error);
                this._snackBar.open('Error deleting activity', 'Close', {
                    duration: 8000,
                    panelClass: ['snackbar-error', 'custom-close-button'],
                });
            },
        );
    }
}
