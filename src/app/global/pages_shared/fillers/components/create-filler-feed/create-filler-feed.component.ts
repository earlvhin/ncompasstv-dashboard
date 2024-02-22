import { Component, OnInit, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FillerService, AuthService } from 'src/app/global/services';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-create-filler-feed',
    templateUrl: './create-filler-feed.component.html',
    styleUrls: ['./create-filler-feed.component.scss'],
})
export class CreateFillerFeedComponent implements OnInit {
    active_btn_filter: string = 'ALL';
    assignee_loaded: boolean = false;
    enable_add_button: boolean = false;
    existing_data: any;
    form: FormGroup;
    filler_name: string = '';
    filler_groups: any = [];
    filler_groups_original: any = [];
    filters = ['ALL', 'ADMIN', 'DEALER ADMIN', 'DEALER'];
    groups_loaded: boolean = false;
    groups_to_remove: any = [];
    is_current_user_admin = this._isAdmin;
    selected_assignee: any = [];
    selected_group: any = this.page_data.group;
    selected_groups: any = [];
    selected_dealer: any = [];
    unselected_dealer: any = [];
    final_data_to_upload: any;
    fillerQuantity: any = {};
    total_quantity = 0;
    remaining = 20;

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public page_data: { group: any; id: any; from_edit_table: any },
        private _form_builder: FormBuilder,
        private _filler: FillerService,
        private _dialog: MatDialog,
        private _route: Router,
        private _auth: AuthService,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.getAllFillers();
    }

    private getFillerFeedDetail(id) {
        this._filler
            .get_filler_group_solo(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.existing_data = data;
                this.selected_assignee.push({
                    id: this.existing_data.assignedDealers[0].dealerId,
                    value: this.existing_data.assignedDealers[0].businessName,
                });
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
                const existing_list = this.filler_groups.filter((list) => list.fillerGroupId == groups.fillerGroupId);
                groups.count = existing_list[0].count;
            });

            data.fillerGroups.map((groups) => {
                this.removeItemsOnTheList(groups.fillerGroupId);
            });

            this.selected_groups = data.fillerGroups;
            this.countTotalQuantity();
        }, 1000);
    }

    removeItemsOnTheList(id) {
        this.filler_groups = this.filler_groups.filter((groups) => {
            return groups.fillerGroupId != id;
        });
    }

    private initializeForm(): void {
        this.form = this._form_builder.group({
            fillerGroupName: [null, Validators.required],
            fillerInterval: [1, Validators.required],
            fillerDuration: [20, Validators.required],
            fillerQuantity: [null],
            fillerGroupId: [null],
        });
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
                let groups_with_count_only = data.paging.entities.filter((group) => {
                    return group.count > 0;
                });
                this.filler_groups = groups_with_count_only;
                this.filler_groups_original = this.filler_groups;
            })
            .add(() => {
                this.groups_loaded = true;
                if (this.page_data.from_edit_table) {
                    this.getFillerFeedDetail(this.page_data.id);
                    return;
                }
                this.assignee_loaded = true;
                if (this.selected_group.length != 0) {
                    this.filler_name = this.selected_group.name;
                    this.setFillerGroup(this.selected_group.fillerGroupId);
                    this.addToSelectedFillerGroup();
                }
            });
    }

    onFilterGroup(filter) {
        this.active_btn_filter = filter;
        this.active_btn_filter = filter;

        switch (filter) {
            case 'ALL':
                this.filler_groups = this.filler_groups_original;
                break;
            case 'ADMIN':
            case 'DEALER':
            case 'DEALER ADMIN':
                this.filler_groups = this.filler_groups_original.filter((group) => {
                    return group.role == (filter === 'ADMIN' ? 1 : filter === 'DEALER' ? 2 : 3);
                });
                break;
            default:
        }
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

    setFillerGroup(id: string) {
        this._formControls.fillerGroupId.setValue(id);
        this.enable_add_button = true;
    }

    addToSelectedFillerGroup() {
        let group = this.filler_groups.filter((groups) => {
            groups.quantity = 1;
            return groups.fillerGroupId == this._formControls.fillerGroupId.value;
        });
        this.selected_groups.push(group[0]);

        //Remove from current selection
        this.filler_groups = this.filler_groups.filter((groups) => {
            return groups.fillerGroupId != this._formControls.fillerGroupId.value;
        });
        this.enable_add_button = false;
        this.countTotalQuantity();
    }

    removeSelectedFiller(group) {
        this.groups_to_remove.push(group.fillerGroupId);

        //Push to current selection
        this.filler_groups.push(group);

        //Remove from selected groups
        this.selected_groups = this.selected_groups.filter((groups) => {
            return groups.fillerGroupId != group.fillerGroupId;
        });

        this.countTotalQuantity();
    }

    arrangeData() {
        this.final_data_to_upload = {
            name: this._formControls.fillerGroupName.value,
            Interval: this._formControls.fillerInterval.value,
            Duration: this._formControls.fillerDuration.value,
            AssignedDealerIds: this.selected_dealer,
            DeleteAssignedDealers: this.unselected_dealer,
            PlaylistGroups: [],
        };

        if (this.page_data.from_edit_table) {
            this.final_data_to_upload.DeletePlaylistGroups = this.groups_to_remove;
            this.final_data_to_upload.fillerPlaylistId = this.existing_data.fillerPlaylistId;
        }

        this.selected_groups.map((group) => {
            let group_selected = {
                fillerGroupId: group.fillerGroupId,
                Quantity: group.quantity,
            };
            this.final_data_to_upload.PlaylistGroups.push(group_selected);
        });

        this.onSubmit(this.final_data_to_upload);
    }

    disableSelectionField() {
        if ((this.filler_groups.length == 0 && this.groups_loaded) || this.filler_name != '') return true;
        else return false;
    }

    countTotalQuantity() {
        this.total_quantity = 0;
        this.remaining = 20;
        this.selected_groups.map((group) => {
            this.total_quantity = this.total_quantity + group.quantity;
        });
        this.remaining = this.remaining - this.total_quantity;
    }

    enforceMinMax(el) {
        if (el.target.value != '') {
            if (parseInt(el.target.value) < parseInt(el.target.min)) el.target.value = el.target.min;
            if (parseInt(el.target.value) > parseInt(el.target.max)) el.target.value = el.target.max;
        }
    }

    saveQuantity(index) {
        this.selected_groups[index].quantity = this._formControls.fillerQuantity.value;
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
            this.selected_dealer.push(data.id);
            this.getAllFillers('', data.id);
            //just incase there has been a group selected before assigning to an assignee so remove selected groups
            this.selected_groups = [];
            this.countTotalQuantity();
            return;
        }
        this.unselected_dealer.push(this.existing_data.assignedDealers[0].dealerId);
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }

    protected get _isAdmin() {
        return this._auth.current_role === UI_ROLE_DEFINITION_TEXT.administrator;
    }
}
