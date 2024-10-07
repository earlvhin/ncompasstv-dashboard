import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FillerService, AuthService } from 'src/app/global/services';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
    UI_ROLE_DEFINITION_TEXT,
    API_FILLER_GROUP,
    UI_AUTOCOMPLETE,
    UI_AUTOCOMPLETE_DATA,
} from 'src/app/global/models';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-create-filler-feed',
    templateUrl: './create-filler-feed.component.html',
    styleUrls: ['./create-filler-feed.component.scss'],
})
export class CreateFillerFeedComponent implements OnInit {
    active_btn_filter: string = 'ALL';
    assignee_loaded: boolean = false;
    clearSelection: boolean = false;
    enable_add_button: boolean = false;
    existing_data: any;
    dealerHasValue: boolean;
    dealerLoaded = false;
    form: FormGroup;
    fillerName: string = '';
    fillerGroups: API_FILLER_GROUP[];
    fillerGroupsForAutoComplete: UI_AUTOCOMPLETE;
    fillerGroupsOriginal: API_FILLER_GROUP[];
    filters = ['ALL', 'ADMIN', 'DEALER ADMIN', 'DEALER'];
    formLoaded = false;
    groupsLoaded = false;
    groupsToRemove = [];
    is_current_user_admin = this._isAdmin;
    isCurrentUserDealerAdmin = this.isDealerAdmin;
    modifiedFillerGroups: UI_AUTOCOMPLETE_DATA[] = [];
    selected_assignee: any = [];
    selectedGroup: any = this.page_data.group;
    selectedGroups: API_FILLER_GROUP[] = [];
    selected_dealer: any = [];
    unselected_dealer: any = [];
    final_data_to_upload: any;
    fillerQuantity: any = {};
    savingInProgress = false;
    total_quantity = 0;
    remaining = 20;
    validatingValue = false;
    private debounceTimeout: any;

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public page_data: { group: any; id: any; from_edit_table: any },
        private _form_builder: FormBuilder,
        private _filler: FillerService,
        private _dialog: MatDialog,
        private _route: Router,
        private _auth: AuthService,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.getAllFillers();
    }

    private getFillerFeedDetail(id) {
        this._filler
            .getFillerGroupSolo(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.existing_data = data;
                if (this.existing_data.assignedDealers.length) {
                    this.selected_assignee.push({
                        id: this.existing_data.assignedDealers[0].dealerId,
                        value: this.existing_data.assignedDealers[0].businessName,
                    });
                    this.dealerHasValue = true;
                }
            })
            .add(() => {
                this.assignee_loaded = true;
                this.fillUpForm(this.existing_data);
            });
    }

    fillUpForm(data) {
        this._formControls.fillerGroupName.setValue(data.name);
        this._formControls.fillerInterval.setValue(data.interval);
        this._formControls.fillerDuration.setValue(data.duration);

        setTimeout(() => {
            data.fillerGroups.map((groups) => {
                const existing_list = this.fillerGroups.filter((list) => list.fillerGroupId == groups.fillerGroupId);
                groups.count = existing_list[0].count;
            });

            data.fillerGroups.map((groups) => {
                this.removeItemsOnTheList(groups.fillerGroupId);
            });

            this.selectedGroups = data.fillerGroups;
            this.countTotalQuantity();

            this.formLoaded = true;
        }, 1000);
    }

    public removeItemsOnTheList(id): void {
        this.fillerGroups = this.fillerGroups.filter((groups) => {
            return groups.fillerGroupId != id;
        });
    }

    private initializeForm(): void {
        this.form = this._form_builder.group({
            fillerGroupName: [
                { value: null, disabled: this.page_data.from_edit_table && !this.dealerLoaded },
                [Validators.required, this.noWhitespace],
            ],
            fillerInterval: [
                { value: 1, disabled: this.page_data.from_edit_table && !this.dealerLoaded },
                Validators.required,
            ],
            fillerDuration: [
                { value: 20, disabled: this.page_data.from_edit_table && !this.dealerLoaded },
                Validators.required,
            ],
            fillerQuantity: [null],
            fillerGroupId: [null],
        });
    }

    public noWhitespace(control: FormControl) {
        let isWhitespace = (control.value || '').trim().length === 0;
        let isValid = !isWhitespace;
        return isValid ? null : { whitespace: true };
    }

    public formFullyLoaded(event: boolean): void {
        this.dealerLoaded = event;
        this._formControls.fillerGroupName.enable();
        this._formControls.fillerInterval.enable();
        this._formControls.fillerDuration.enable();
    }

    protected get _formControls() {
        return this.form.controls;
    }

    //is_Dealer temporary only until has API
    getAllFillers(key?, assignee?) {
        this._filler
            .get_filler_group_for_feeds(assignee)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                let groupsWithCountOnly = data.paging.entities.filter((group) => {
                    return group.count > 0;
                });
                this.fillerGroups = groupsWithCountOnly;
                this.fillerGroupsOriginal = this.fillerGroups;
            })
            .add(() => {
                this.groupsLoaded = true;
                if (this.page_data.from_edit_table) {
                    this.getFillerFeedDetail(this.page_data.id);
                    return;
                }
                this.assignee_loaded = true;
                if (this.selectedGroup.length != 0) {
                    this.fillerName = this.selectedGroup.name;
                    this.setFillerGroup(this.selectedGroup.fillerGroupId);
                    this.addToSelectedFillerGroup();
                }
                this.setFillersAutocomplete();
            });
    }

    public onFilterGroup(filter): void {
        this.active_btn_filter = filter;

        switch (filter) {
            case 'ALL':
                this.fillerGroups = this.fillerGroupsOriginal;
                break;
            case 'ADMIN':
            case 'DEALER':
            case 'DEALER ADMIN':
                this.fillerGroups = this.fillerGroupsOriginal.filter((group) => {
                    return group.role == (filter === 'ADMIN' ? 1 : filter === 'DEALER' ? 2 : 3);
                });
                break;
            default:
        }

        this.setFillersAutocomplete();
    }

    onSubmit(data) {
        let type_of_activity = '';
        if (this.page_data.from_edit_table) type_of_activity = ' Updated ';
        else type_of_activity = ' Created ';

        this._filler
            .add_filler_feed(data)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: any) => {
                    this.openConfirmationModal(
                        'success',
                        'Filler Feed' + type_of_activity + '!',
                        'Hurray! You successfully' + type_of_activity + 'a Filler Feed',
                    );
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    openConfirmationModal(status: string, message: string, data: any): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: {
                    status: status,
                    message: message,
                    data: data,
                },
            })
            .afterClosed()
            .subscribe((response) => {
                this._route.navigateByUrl(`/${this.roleRoute}/feeds?tab=1`);
                this._dialog.closeAll();
            });
    }

    public setFillerGroup(value: UI_AUTOCOMPLETE_DATA): void {
        if (!value) return;
        this._formControls.fillerGroupId.setValue(value.id);
        this.addToSelectedFillerGroup();
    }

    public addToSelectedFillerGroup(): void {
        const selectedId = this._formControls.fillerGroupId.value;
        const group = this.fillerGroups.find((groups) => groups.fillerGroupId === selectedId);

        if (group) {
            group.quantity = 1;
            this.selectedGroups.push(group);
            this.fillerGroups = this.fillerGroups.filter((groups) => groups.fillerGroupId !== selectedId);
            this.fillerGroupsOriginal = this.fillerGroupsOriginal.filter(
                (groups) => groups.fillerGroupId !== selectedId,
            );
            this.setFillersAutocomplete();
            this.clearSelection = true;
        }

        this.enable_add_button = false;
        this.countTotalQuantity();
    }

    public removeSelectedFiller(group): void {
        const { fillerGroupId } = group;

        this.groupsToRemove.push(fillerGroupId);
        this.fillerGroups.push(group);
        this.fillerGroupsOriginal.push(group);

        this.selectedGroups = this.selectedGroups.filter((groups) => groups.fillerGroupId !== fillerGroupId);
        this.setFillersAutocomplete();
        this.countTotalQuantity();
    }

    arrangeData() {
        this.savingInProgress = true;
        this.final_data_to_upload = {
            name: this._formControls.fillerGroupName.value,
            Interval: this._formControls.fillerInterval.value,
            Duration: this._formControls.fillerDuration.value,
            AssignedDealerIds: this.selected_dealer,
            DeleteAssignedDealers: this.unselected_dealer,
            PlaylistGroups: [],
        };

        if (this.page_data.from_edit_table) {
            this.final_data_to_upload.DeletePlaylistGroups = this.groupsToRemove;
            this.final_data_to_upload.fillerPlaylistId = this.existing_data.fillerPlaylistId;
        }

        this.selectedGroups.map((group) => {
            let group_selected = {
                fillerGroupId: group.fillerGroupId,
                Quantity: group.quantity,
            };
            this.final_data_to_upload.PlaylistGroups.push(group_selected);
        });

        this.onSubmit(this.final_data_to_upload);
    }

    public disableSelectionField(): boolean {
        if ((this.fillerGroups.length == 0 && this.groupsLoaded) || this.fillerName != '') return true;
        else return false;
    }

    private countTotalQuantity(): void {
        this.total_quantity = 0;
        this.remaining = 20;
        this.selectedGroups.map((group) => {
            this.total_quantity = this.total_quantity + group.quantity;
        });
        this.remaining = this.remaining - this.total_quantity;
    }

    public enforceMinMax(el): void {
        if (el.target.value != '') {
            if (parseInt(el.target.value) < parseInt(el.target.min)) el.target.value = el.target.min;
            if (parseInt(el.target.value) > parseInt(el.target.max)) el.target.value = el.target.max;
        }
    }

    public saveQuantity(index): void {
        this.selectedGroups[index].quantity = this._formControls.fillerQuantity.value;
        this.countTotalQuantity();
    }

    routeToFillerGroup(id) {
        const url = this._route.serializeUrl(
            this._route.createUrlTree([`/${this.roleRoute}/fillers/view-fillers-group/${id}`], {}),
        );
        window.open(url, '_blank');
    }

    setAssignedTo(data) {
        if (data) {
            this.dealerHasValue = true;
            this.selected_dealer.push(data.id);
            this.getAllFillers('', data.id);
            //just incase there has been a group selected before assigning to an assignee so remove selected groups
            this.selectedGroups = [];
            this.countTotalQuantity();
            return;
        }
        this.dealerHasValue = false;
        this.unselected_dealer.push(this.existing_data.assignedDealers[0].dealerId);
    }

    public onIntervalChange(key: string): void {
        const intervalKey = parseInt(key);
        if (intervalKey < 1) this._formControls.fillerInterval.setValue(1);
    }

    public onDurationChange(event: KeyboardEvent): void {
        this.validatingValue = true;
        //Add timeout to allow users to type 1 (for hundred values) cause if not it always default to less than 20
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            const newKey = parseInt((event.target as HTMLInputElement).value);
            if (newKey < 20) this._formControls.fillerDuration.setValue(20);
            this.validatingValue = false;
        }, 500);
    }

    public disableUpdateForm(): boolean {
        const isFormInvalid = this.form.invalid;
        const isQuantityOverLimit = this.total_quantity > 20;
        const isQuantityZero = this.total_quantity === 0;
        const isEditingFromTableAndDealerNotLoaded = this.page_data.from_edit_table && !this.dealerLoaded;
        const isValidationInProgress = this.validatingValue;
        const isSavingInProgress = this.savingInProgress;

        return (
            isFormInvalid ||
            isQuantityOverLimit ||
            isQuantityZero ||
            isEditingFromTableAndDealerNotLoaded ||
            isValidationInProgress ||
            isSavingInProgress
        );
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }

    /**
     * Populate Filler group autocomplete data
     * returns a data patterned to autocomplete structure
     */
    public setFillersAutocomplete(): void {
        this.modifiedFillerGroups = [];
        this.fillerGroups.forEach((group) => {
            this.modifiedFillerGroups.push({
                id: group.fillerGroupId,
                value: this.getGroup(group.role) + '-' + group.name,
            });
        });
        this.fillerGroupsForAutoComplete = {
            label: 'Select Filler Group',
            placeholder: 'Ex. NCompassTV Trivia',
            data: this.modifiedFillerGroups,
            unselect: true,
        };
    }

    /**
     *
     * @param group rolenumber (1 admin, 2 Dealer, 3 Dealer Admin)
     * @returns a string initial of what type of user is the owner
     */
    private getGroup(group: number): string {
        switch (group) {
            case 1:
                return 'A';
            case 2:
                return 'D';
            default:
                return 'DA';
        }
    }

    protected get _isAdmin() {
        return this._auth.current_role === UI_ROLE_DEFINITION_TEXT.administrator;
    }

    protected get isDealerAdmin() {
        return this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin;
    }
}
