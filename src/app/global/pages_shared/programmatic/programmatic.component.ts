import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddProgrammaticModalComponent } from 'src/app/global/components_shared/programmatic_components/add-programmatic-modal/add-programmatic-modal.component';
import { ToolsService } from '../../services/tools/tools.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
    selector: 'app-tools',
    templateUrl: './programmatic.component.html',
    styleUrls: ['./programmatic.component.scss'],
})
export class ProgrammaticComponent implements OnInit {
    global_settings_form: FormGroup;
    title: string = 'Programmatic';

    constructor(
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _tool: ToolsService,
    ) {}

    ngOnInit() {
        this.global_settings_form = this._form.group({
            vistarNetworkId: ['', Validators.required],
            vistarApiKey: ['', Validators.required],
        });

        this.getGlobalSettings();
    }

    ngOnDestroy() {}

    openAddProgrammaticModal(): void {
        this._dialog
            .open(AddProgrammaticModalComponent, {
                height: 'auto',
                width: '992px',
            })
            .afterClosed()
            .subscribe(() => this.ngOnInit());
    }

    getGlobalSettings() {
        this._tool.getGlobalSettings().subscribe((data) => {});
    }
}
