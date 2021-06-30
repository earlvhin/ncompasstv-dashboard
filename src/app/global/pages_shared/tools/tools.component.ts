import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import * as moment from 'moment';
import { ToolsService } from '../../services/tools/tools.service';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {

	title: string = "Administrative Tools";
	remote_update_disabled: boolean;
	remote_reboot_disabled: boolean;
	timeout_duration: number;
	timeout_message: string;
	terminal_entered_scripts: string[] = [];
	terminal_value: string;

	_socket: any;

	constructor(
		private _dialog: MatDialog,
		private _tool: ToolsService
	) { 
		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
			query: 'client=Dashboard__ToolsComponent',
		});
	}

	ngOnInit() {
		this._socket.on('connect', () => {
			console.log('#ToolsComponent - Connected to Socket Server');
		})
		
		this._socket.on('disconnect', () => {
			console.log('#ToolsComponent - Disconnnected to Socket Server');
		})
		
		this.disableTimeoutChecker();
	}

	ngOnDestroy() {
		this._socket.disconnect();
	}

	disableTimeoutChecker() {
		const admin_tools_disabled = localStorage.getItem('admin_tools_disabled');

		if (admin_tools_disabled) {
			this.timeout_duration = moment().diff(moment(admin_tools_disabled, 'MMMM Do YYYY, h:mm:ss a'), 'minutes');
			console.log(admin_tools_disabled, this.timeout_duration)

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
		this.warningModal('warning', 'Delete All Screenshots', 'Are you sure you want to delete all screenshots?','','delete_screenshots')
	}

	remoteUpdateAll() {
		this.warningModal('warning', 'Update and Reboot', 'Update and reboot all online players?','','update_reboot')
	}

	remoteRebootAll() {
		this.warningModal('warning', 'Reboot Players', 'Are you sure you want reboot all online players?','','reboot_only')
	}

	remoteRunTerminal() {
		this.warningModal('warning', 'Run Script', 'Are you sure you want to run this script to all players?', '', 'run_script')
	}

	renewSocket() {
		this.warningModal('warning', 'Renew Socket', 'You are about to renew all socket connections?', '', 'renew_socket')
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
				action: action
			}
		})

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				if(result == 'update_reboot') {
					console.log('D_system_update');
					this._socket.emit('D_system_update');
				} else if(result == 'reboot_only') {
					console.log('D_system_reboot');
					this._socket.emit('D_system_reboot');
				} else  if(result == 'run_script') {
					console.log(this.terminal_value);
					this.terminal_entered_scripts.push(this.terminal_value);
					this._socket.emit('D_run_script_to_all', this.terminal_value);
				} else if(result == 'renew_socket') {
					this._tool.resetSocketConnection().subscribe(
						data => console.log(data),
						error => console.log(error)
					)
				} else if(result == 'delete_screenshots') {
					this._tool.deleteScreenshots().subscribe(
						data => console.log(data),
						error => console.log(error)
					)
				}
	
				const now = moment().format('MMMM Do YYYY, h:mm:ss a');
				localStorage.setItem('admin_tools_disabled', `${now}`)
				this.timeout_duration = 0;
				this.timeout_message = `Will be available after ${10 - this.timeout_duration} minutes`;
				this.remote_reboot_disabled = true;
				this.remote_update_disabled = true;
			}
		});
	}
}