import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MatSelectChange, MAT_DIALOG_DATA } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
    API_PLAYLIST,
    API_SINGLE_PLAYLIST,
    API_TEMPLATE,
    API_ZONE,
    DIALOG_DATA_CHANGE_TEMPLATE,
    FORM_CONTROL,
    UI_SCREEN_ZONE_PLAYLIST,
    UI_SINGLE_SCREEN,
    UI_ZONE_PLAYLIST,
} from 'src/app/global/models';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-change-template',
    templateUrl: './change-template.component.html',
    styleUrls: ['./change-template.component.scss'],
})
export class ChangeTemplateComponent implements OnInit, OnDestroy {
    currentTemplate: API_TEMPLATE;
    changeTemplateForm: FormGroup;
    dealerPlaylists: API_PLAYLIST[];
    fieldInputList = ['text', 'number', 'select'];
    otherInputList = ['accordion-select'];
    formControls: FORM_CONTROL[];
    hasSelectedTemplate = false;
    isFormReady = false;
    mappedZones: UI_ZONE_PLAYLIST[];
    mappedTemplates: { name: string; id: string }[];
    playlistId: string;
    playlistRoute: string;
    screen: UI_SINGLE_SCREEN;
    screenZonePlaylists: UI_SCREEN_ZONE_PLAYLIST[];
    selectedZonesFormArray: any;
    selectedTemplate: API_TEMPLATE;
    templates: API_TEMPLATE[];
    title = 'Change Template';

    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) private _dialog_data: DIALOG_DATA_CHANGE_TEMPLATE,
        private _dialog: MatDialog,
        private _dialog_reference: MatDialogRef<ChangeTemplateComponent>,
        private _form_builder: FormBuilder,
    ) {}

    ngOnInit() {
        this.setDialogData();
        this.initializeForm();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onSubmit() {
        const { template, zones } = this.changeTemplateForm.value as {
            template: { id: string; name: string };
            zones: { templateZoneId: string; playlistId: string }[];
        };
        const { screen_id } = this.screen;

        const body = {
            old: {
                screen: {
                    screenId: screen_id,
                },
            },
            new: {
                screen: {
                    templateId: template.id,
                },
                screenZonePlaylists: zones,
            },
        };

        this.openConfirmDialog()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: boolean) => {
                if (!response) return;
                this._dialog_reference.close(body);
            });
    }

    onSelectPlaylist(zone: API_ZONE, event: MatSelectChange) {
        const { templateZoneId } = zone;
        const { playlistId } = event.value as API_PLAYLIST;
        const control = this.changeTemplateForm.get('zones');
        let currentPlaylists = [...control.value] as {
            templateZoneId: string;
            playlistId: string;
        }[];
        const assignedZoneIndex = currentPlaylists.findIndex(
            (data) => data.templateZoneId === zone.templateZoneId,
        );
        if (assignedZoneIndex !== -1) currentPlaylists.splice(assignedZoneIndex, 1);
        currentPlaylists.push({ templateZoneId, playlistId });
        control.setValue(currentPlaylists);
    }

    private initializeForm(): void {
        const config: any = {};

        this._formControls.forEach((control) => {
            let controlValue: any = [null];
            if (control.required) controlValue.push(Validators.required);
            config[control.name] = controlValue;
        });

        this.changeTemplateForm = this._form_builder.group(config);
        this.mappedTemplates = this.mapTemplates();
        this.mappedZones = this.mapZones();
        this.formControls = this._formControls;
        this.isFormReady = true;
        this.subscribeToChangeTemplate();
    }

    private mapTemplates() {
        return this._dialog_data.templates.map((data) => {
            const { name, templateId } = data.template;
            return { name, id: templateId };
        });
    }

    private mapZones() {
        return this._dialog_data.screenZonePlaylists.map((data) => data.screen_template);
    }

    private openConfirmDialog() {
        const message = 'Please make sure that playlists are assigned to their respective zones';
        const title = 'Change Template Confirmation';
        const status = 'warning';
        const return_msg = 'Confirmed Template Change';
        const width = '500px';
        const height = '350px';
        return this._dialog
            .open(ConfirmationModalComponent, {
                width,
                height,
                data: { status, message: title, data: message, return_msg },
            })
            .afterClosed();
    }

    private setDialogData() {
        const {
            currentTemplate,
            dealerPlaylists,
            screenZonePlaylists,
            playlistId,
            playlistRoute,
            screen,
            templates,
        } = this._dialog_data;
        this.currentTemplate = currentTemplate;
        this.dealerPlaylists = dealerPlaylists;
        this.screenZonePlaylists = [...screenZonePlaylists];
        this.playlistId = playlistId;
        this.playlistRoute = playlistRoute;
        this.templates = [...templates];
        this.screen = screen;
    }

    private subscribeToChangeTemplate() {
        this.changeTemplateForm.controls.template.valueChanges
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: { name: string; id: string }) => {
                this.selectedTemplate = this.templates.filter(
                    (data) => data.template.templateId === response.id,
                )[0];
                this.changeTemplateForm.removeControl('zones');
                this.changeTemplateForm.addControl(
                    'zones',
                    this._form_builder.control([], Validators.required),
                );

                // const selectedTemplateZones = this.selectedTemplate.templateZones;

                this.selectedZonesFormArray = this.changeTemplateForm.get('zones');
                this.hasSelectedTemplate = true;
            });
    }

    protected get _formControls(): FORM_CONTROL[] {
        return [
            {
                name: 'template',
                label: 'Select Template',
                type: 'select',
                options: this.mappedTemplates,
                option_label: 'name',
                required: true,
            },
        ];
    }
}
