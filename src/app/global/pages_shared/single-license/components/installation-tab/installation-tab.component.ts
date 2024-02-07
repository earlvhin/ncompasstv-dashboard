import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { LicenseService, AuthService } from 'src/app/global/services';
import { UI_ROLE_DEFINITION } from 'src/app/global/models';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { EditableFieldModalComponent } from 'src/app/global/components_shared/page_components/editable-field-modal/editable-field-modal.component';

@Component({
    selector: 'app-installation-tab',
    templateUrl: './installation-tab.component.html',
    styleUrls: ['./installation-tab.component.scss'],
})
export class InstallationTabComponent implements OnInit {
    @Input() license_id: string;
    edit_tasks: boolean = false;
    form: FormGroup;
    is_dealer: boolean = false;
    id_to_delete: any = [];
    license_checklist: any = [];
    list_to_check: any = [];
    loaded: boolean = false;
    loaded_list: boolean = false;
    task_field_open: boolean = false;
    task_items: any = [];
    task_items_container: any = [];
    checklist_items: any = [];
    titles: any = [];
    tasks_to_edit: any = [];
    section_title: any;
    current_checklist_title: string = 'fcde9269-2f3c-4dd2-9594-7a15ac839b09';

    constructor(
        private _auth: AuthService,
        private fb: FormBuilder,
        private _license: LicenseService,
        private _dialog: MatDialog,
    ) {
        this.form = this.fb.group({
            published: true,
            categoryName: '',
            tasks: this.fb.array([]),
        });
    }

    ngOnInit() {
        this.userCheck();
        this.getChecklistList();
        this.getChecklistTitles();
    }

    userCheck() {
        const roleId = this._auth.current_user_value.role_id;
        const dealerRole = UI_ROLE_DEFINITION.dealer;
        const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

        if (roleId === dealerRole || roleId === subDealerRole) {
            this.is_dealer = true;
        }
    }

    getChecklist() {
        this._license.get_checklist_by_license_id(this.license_id).subscribe((data) => {
            if (data.checkLists.length > 0) {
                data.checkLists.map((list) => {
                    this.checkIfExisting(list.installationChecklistItemId, list.isDone);
                });
                this.license_checklist = data.checkLists;
            } else {
                this.license_checklist = [];
            }
            if (this.checklist_items.length > 0) {
                this.getCount();
            }

            this.loaded = true;
        });
    }

    getCount(temporary?) {
        this.checklist_items.map((list) => {
            if (list.installationChecklistItems) {
                if (temporary) {
                    list.doneCount = this.filterByCheck(
                        list.installationChecklistItems,
                        list.installationChecklist.installationChecklistId,
                    );
                    list.totalList = list.installationChecklistItems.length;
                    list.percentage = ((list.doneCount / list.totalList) * 100).toFixed(0);
                } else {
                    list.doneCount =
                        this.license_checklist.length > 0
                            ? this.filterByValue(
                                  this.license_checklist,
                                  list.installationChecklist.installationChecklistId,
                              )
                            : 0;
                    list.totalList = list.installationChecklistItems.length;
                    list.percentage = ((list.doneCount / list.totalList) * 100).toFixed(0);
                }
            } else {
                list.doneCount = 0;
                list.totalList = 0;
                list.percentage = 0;
            }
        });
    }

    filterByValue(array, string) {
        return array.filter(function (item) {
            return item.installationChecklistId === string;
        }).length;
    }

    filterByCheck(array, string) {
        return array.filter(function (item) {
            if (item.installationChecklistId === string) {
                return item.isDone === 1;
            }
        }).length;
    }

    checkIfExisting(id, value) {
        this.checklist_items.map((list) => {
            if (list.installationChecklistItems != null) {
                list.installationChecklistItems.map((item) => {
                    if (item.installationChecklistItemId == id) {
                        item.isDone = value;
                    }
                });
            } else {
            }
        });
    }

    getChecklistList() {
        this.checklist_items = [];
        this._license.get_checklist().subscribe((data) => {
            if (!data.message) {
                this.checklist_items = data.installationChecklistGroups;
                this.getChecklist();
            } else {
                this.checklist_items = [];
            }
            this.loaded_list = true;
        });
    }

    getChecklistTitles() {
        this._license.get_checklist_titles().subscribe((data) => {
            this.titles = data.checkLists;
        });
    }

    setTitle(id) {
        if (id) {
            this.current_checklist_title = id;
        } else {
        }
    }

    saveTitle() {
        this.section_title = this.form.controls.categoryName.value;
        let modified_title = {
            title: this.section_title,
            desc: '',
            seq: this.titles.length > 0 ? this.titles[this.titles.length - 1].seq + 1 : 1,
        };
        this._license.create_installation_checklist_title(modified_title).subscribe((data) => {
            this.confirmationModal(
                'success',
                'Checklist Title has been added successfully',
                'Click OK to continue',
            );
            this.form.reset();
            this.ngOnInit();
        });
    }

    updateTitle(data) {
        let status = {
            editable: true,
            hidden: false,
            id: data.installationChecklistId,
            label: 'Checklist Title',
            link: null,
            value: data.title,
        };

        const dialogParams: any = {
            width: '500px',
            data: { status: status, message: 'Checklist Title', data: data.title },
        };
        const dialog = this._dialog.open(EditableFieldModalComponent, dialogParams);
        const close = dialog.afterClosed().subscribe((response) => {
            if (response) {
                let modified_title = {
                    title: response,
                    desc: '',
                    seq: data.seq,
                    installationChecklistId: data.installationChecklistId,
                };
                this._license
                    .update_installation_checklist_title(modified_title)
                    .subscribe((data) => {
                        this.confirmationModal(
                            'success',
                            'Checklist Title has been updated successfully',
                            'Click OK to continue',
                        );
                        this.ngOnInit();
                    });
            }
        });
    }

    updateItem(data) {
        let status = {
            editable: true,
            hidden: false,
            id: data.installationChecklistItemId,
            label: 'Checklist Item',
            link: null,
            value: data.title,
        };

        const dialogParams: any = {
            width: '500px',
            data: { status: status, message: 'Checklist Item', data: data.title },
        };
        const dialog = this._dialog.open(EditableFieldModalComponent, dialogParams);
        const close = dialog.afterClosed().subscribe((response) => {
            if (response) {
                let modified_title = {
                    title: response,
                    desc: '',
                    seq: data.seq,
                    installationChecklistItemId: data.installationChecklistItemId,
                    installationChecklistId: data.installationChecklistId,
                };
                this.tasks_to_edit.push(modified_title);
                this.modifiedDataDisplayTemporary(modified_title, 'editing');
            }
        });
    }

    modifiedDataDisplayTemporary(modified_item, mode) {
        let obj = this.checklist_items.find(
            (o) => o.installationChecklist === 'c6cc9507-5273-4a51-bec2-0d8fab768ae9',
        );
        this.checklist_items = this.checklist_items.map((list) => {
            switch (mode) {
                case 'deleting':
                    if (
                        list.installationChecklist.installationChecklistId ===
                        modified_item.installationChecklistId
                    ) {
                        list.installationChecklistItems.splice(
                            list.installationChecklistItems.findIndex(
                                (item) =>
                                    item.installationChecklistItemId ===
                                    modified_item.installationChecklistItemId,
                            ),
                            1,
                        );
                    }
                    break;
                case 'editing':
                    if (
                        list.installationChecklist.installationChecklistId ===
                        modified_item.installationChecklistId
                    ) {
                        list.installationChecklistItems.map((innerList) => {
                            if (
                                innerList.installationChecklistItemId ===
                                modified_item.installationChecklistItemId
                            ) {
                                innerList.titleToChange = modified_item.title;
                            }
                        });
                    }
                    break;
                case 'checking':
                    if (
                        list.installationChecklist.installationChecklistId ===
                        modified_item.installationChecklistId
                    ) {
                        list.installationChecklistItems.map((innerList) => {
                            if (
                                innerList.installationChecklistItemId ===
                                modified_item.installationChecklistItemId
                            ) {
                                innerList.isDone = 1;
                            }
                        });
                    }
                    break;
                case 'unchecking':
                    if (
                        list.installationChecklist.installationChecklistId ===
                        modified_item.installationChecklistId
                    ) {
                        list.installationChecklistItems.map((innerList) => {
                            if (
                                innerList.installationChecklistItemId ===
                                modified_item.installationChecklistItemId
                            ) {
                                innerList.isDone = 0;
                            }
                        });
                    }
                    break;
                default:
            }
            return list;
        });
        this.getCount(true);
    }

    addTaskItems() {
        this.task_field_open = true;
        this.task_items = this.form.controls.tasks as FormArray;
        this.task_items.push(
            this.fb.group({
                task: '',
            }),
        );
    }

    removeTaskItems(index) {
        this.task_items.removeAt(index);
        if (this.task_items.length < 1) {
            this.task_field_open = false;
        }
    }

    editMode() {
        if (this.edit_tasks) {
            this.selectionModal(
                'warning',
                'Do you want to save the changes made on this form?',
                '',
            );
        }
        this.edit_tasks = true;
    }

    getFormValues() {
        this.task_items_container = [];
        this.task_items.value.map((task, index) => {
            if (task.task != '') {
                this.task_items_container.push({
                    installationchecklistid: this.current_checklist_title,
                    title: task.task,
                    description: '',
                    isdone: 0,
                    seq: index + 1,
                });
            } else {
            }
        });

        if (this.task_items_container.length > 0) {
            this._license
                .add_installation_checklist_items(this.task_items_container)
                .subscribe((data) => {
                    this.confirmationModal(
                        'success',
                        'Task has been successfully added.',
                        'Click OK to continue',
                    );
                    this.task_field_open = false;
                    const control = <FormArray>this.form.controls['tasks'];
                    for (let i = control.length - 1; i >= 0; i--) {
                        control.removeAt(i);
                    }
                    this.ngOnInit();
                });
        } else {
            this.confirmationModal(
                'error',
                'Make sure to fill up all the necessary fields to create a task.',
                '',
            );
        }
    }

    checkItem(value, item) {
        let filter = [
            {
                InstallationChecklistItemId: item.installationChecklistItemId,
                LicenseId: this.license_id,
                isDone: value ? 1 : 0,
            },
        ];
        this.modifiedDataDisplayTemporary(item, value ? 'checking' : 'unchecking');
        this._license.update_list_checking(filter).subscribe((data) => {});
    }

    deleteChecklistId(id) {
        this.warningModal(
            'warning',
            'Delete Checklist Title',
            'Are you sure you want to delete this title? By proceeding it will delete all the corresponding tasks under this title.',
            '',
            'title_delete',
            id,
        );
    }

    deleteItem(items) {
        this.id_to_delete.push(items.installationChecklistItemId);
        this.modifiedDataDisplayTemporary(items, 'deleting');
    }

    warningModal(
        status: string,
        message: string,
        data: string,
        return_msg: string,
        action: string,
        id: any,
    ): void {
        const dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data, return_msg, action },
        });

        dialogRef.afterClosed().subscribe((result) => {
            switch (result) {
                case 'title_delete':
                    this._license.delete_checklist_id(id).subscribe((data) => {
                        this.ngOnInit();
                    });
                    break;
                default:
            }
        });
    }

    confirmationModal(status, message, data) {
        let dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: {
                status: status,
                message: message,
                data: data,
            },
        });
    }

    selectionModal(status, message, data) {
        let dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: {
                status: status,
                message: message,
                data: data,
                is_selection: true,
                is_installation: true,
            },
        });

        dialogRef.afterClosed().subscribe((response) => {
            if (response === 'no') {
                this.edit_tasks = false;
                this.ngOnInit();
            } else {
                if (this.tasks_to_edit.length > 0) {
                    this._license
                        .update_installation_checklist_item(this.tasks_to_edit)
                        .subscribe((data) => {
                            this.confirmationModal(
                                'success',
                                'Checklist Item(s) has been updated',
                                'Click OK to continue',
                            );
                            this.getChecklistList();
                        });
                }

                if (this.id_to_delete.length > 0) {
                    this._license.delete_checklist_items(this.id_to_delete).subscribe((data) => {
                        this.getChecklistList();
                    });
                }
                this.edit_tasks = false;
                this.ngOnInit();
            }
        });
    }
}
