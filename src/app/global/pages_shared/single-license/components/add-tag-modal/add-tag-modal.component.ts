import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MatSelect } from '@angular/material';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { AuthService, ConfirmationDialogService, TagService } from 'src/app/global/services';
import { CREATE_AND_ASSIGN_TAG_V2, DELETE_TAG_BY_OWNER_ID_AND_TAG_WRAPPER, TAG } from 'src/app/global/models';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-add-tag-modal',
    templateUrl: './add-tag-modal.component.html',
    styleUrls: ['./add-tag-modal.component.scss'],
})
export class AddTagModalComponent implements OnInit, OnDestroy {
    @Input() currentTags: TAG[] = [];
    @Input() ownerId: string = null;
    @Input() ownerName: string = null;
    @ViewChild('tagMultiSelect', { static: true }) tagMultiSelect: MatSelect;
    checkNewTagsQueue: TAG[] = [];
    description = 'You may assign an existing tag or create one for this license';
    filteredTags = new ReplaySubject<TAG[]>(1);
    form: FormGroup;
    isCheckingTagExistence = false;
    isDataReady = false;
    isSearchingTags = false;
    selectedTagColor: string;
    submitting = false;
    tagActions: {
        currentTags: TAG[];
        hasChanges: boolean;
    };
    title = 'Add Tag to License';

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _confirmDialog: ConfirmationDialogService,
        private _currentDialog: MatDialogRef<AddTagModalComponent>,
        private _dialog: MatDialog,
        private _dialogRef: MatDialogRef<AddTagModalComponent>,
        private _formBuilder: FormBuilder,
        private _tag: TagService,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.subscribeToTagSearch();
        this.getAllRecentTags();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    cannotAddTag(): boolean {
        return this._tagNameControl.invalid || this._tagColorControl.invalid || this.isCheckingTagExistence;
    }

    cannotSubmitTags(): boolean {
        return this._newTagsControl.value.length <= 0 && this._existingTagsControl.value.length <= 0;
    }

    async onAddTag() {
        this.isCheckingTagExistence = true;
        const { name, tagColor, description, exclude } = this.form.value;
        const isVerifyingExistence = true;
        const isExisting = false;
        const newTagsControl = this._newTagsControl.value as TAG[];

        try {
            const tagExists = await this._tag.checkTagName(name).pipe(takeUntil(this._unsubscribe)).toPromise();

            if (tagExists) {
                this.isCheckingTagExistence = false;
                const config = {
                    width: '500px',
                    height: '350px',
                    data: {
                        status: 'error',
                        message: 'Cannot Add Tag',
                        data: 'Tag already exists. Please assign it instead.',
                    },
                };

                this._dialog.open(ConfirmationModalComponent, config);
                return;
            }
        } catch (error) {
            console.error('Error verifying tag existence', error);
            this.isCheckingTagExistence = false;
        }

        this.isCheckingTagExistence = false;

        newTagsControl.push({
            name,
            tagColor,
            description,
            exclude,
            isVerifyingExistence,
            isExisting,
        });
        this.isTagExisting(name);
        this._tagColorControl.reset();
        this._tagNameControl.reset();
        this._tagDescriptionControl.reset();
        this._excludeTagControl.reset(false);
        this.selectedTagColor = undefined;
    }

    onExcludeTag(event: { checked: boolean }): void {
        const isExcludedValue = event.checked ? 1 : 0;
        this._excludeTagControl.setValue(isExcludedValue);
    }

    async onRemoveTag(index: number, type: string, tag?: TAG) {
        let data: TAG[] = [];

        switch (type) {
            case 'new':
                data = this._newTagsControl.value;
                break;
            case 'existing':
                data = this._existingTagsControl.value;
                break;
            default:
                data = this.currentTags;

                try {
                    const deleteData: DELETE_TAG_BY_OWNER_ID_AND_TAG_WRAPPER = {
                        TagId: tag.tagId,
                        OwnerId: this.ownerId,
                        TagName: tag.name,
                        OwnerName: this.ownerName,
                    };

                    await this.onDeleteTagFromOwner(deleteData);
                } catch (error) {
                    console.error('Failed to fetch owner name', error);
                }
                return;
        }

        data.splice(index, 1);

        if (type === 'existing') this.tagMultiSelect.compareWith = (a, b) => a && b && a.tagId === b.tagId;
    }

    public closeModal(): void {
        this._dialogRef.close({
            currentTags: this.currentTags,
            hasChanges: false,
            closed: true,
        });
    }

    onSelectTagColor(value: string): void {
        this._tagColorControl.setValue(value);
    }

    /**
     * Handles the form submission to create and assign tags.
     * It processes new and existing tags, formats the data, and sends a request to create and assign the tags to the specified owner.
     *
     * @returns {void}
     */
    public onSubmit(): void {
        this.submitting = true;

        // Process the tags data to be added/created
        const tagsToAdd = (this._newTagsControl.value as TAG[]).map((tag) => {
            return {
                name: tag.name,
                description: tag.description,
                tagColor: tag.tagColor,
                exclude: tag.exclude ? 1 : 0,
            };
        });

        // Combine existing tags with current tags and map to tag IDs
        const tagsToAssign = (this._existingTagsControl.value as TAG[])
            .concat(this.currentTags)
            .map((tag) => tag.tagId);

        // Prepare the payload for tag creation and assignment
        const data: CREATE_AND_ASSIGN_TAG_V2 = {
            tagtypeid: '2',
            createdBy: this._currentUser.user_id,
            owners: [
                {
                    id: this.ownerId,
                    name: this.ownerName,
                },
            ],
            new: tagsToAdd,
            existing: tagsToAssign,
        };

        // Send the request to create and assign tags
        this._tag
            .createAndAssignTags(data, this._isDealer())
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                async (response) => {
                    const tags = response.tags[this.ownerId] as TAG[];
                    this.tagActions = { currentTags: tags, hasChanges: true };
                    this._currentDialog.close(this.tagActions);
                },
                (e) => {
                    console.error('Failed creating/assigning tags', e);
                    this._confirmDialog.error();
                    this.submitting = false;
                },
            );
    }

    private getAllRecentTags() {
        this.isSearchingTags = true;
        let params: { page: number; sortColumn: string; sortOrder: string; role?: number } = {
            page: 1,
            sortColumn: 'DateCreated',
            sortOrder: 'desc',
        };

        if (this._isDealer()) {
            params.role = 2;
        } else if (this._isDealerAdmin()) {
            params.role = 3;
        } else {
            params.role = 1;
        }

        this._tag
            .getAllTags(params, this._isDealer())
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                ({ tags, message }) => {
                    if (message) return;
                    const tagsToRemove = this.currentTags;
                    const removedDuplicateTags = tags.filter(
                        (result) => !tagsToRemove.find((tagToRemove) => tagToRemove.tagId === result.tagId),
                    );
                    this.filteredTags.next(removedDuplicateTags);
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.isSearchingTags = false));
    }

    private initializeForm(): void {
        this.filteredTags.next([]);
        this.form = this._formBuilder.group(this._formControls);
    }

    private isTagExisting(name: string) {
        this._tag
            .checkTagName(name)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: boolean) => {
                const newTags = this._newTagsControl.value as TAG[];
                const index = newTags.findIndex((tag) => tag.name === name);
                (this._newTagsControl.value[index] as TAG).isVerifyingExistence = false;
                (this._newTagsControl.value[index] as TAG).isExisting = response;
            });
    }

    private async onDeleteTagFromOwner(data: DELETE_TAG_BY_OWNER_ID_AND_TAG_WRAPPER): Promise<void> {
        const response = await this.openConfirmAPIRequestDialog('delete_tag_from_owner').toPromise();

        if (!response) return;

        this.submitting = true;

        this._tag
            .deleteTagByIdAndOwner(data)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                async () => {
                    try {
                        const fetchedData = await this._tag.getTagByOwner(this.ownerId).toPromise();
                        this.currentTags = [...fetchedData.tags];
                        this.tagActions = { currentTags: this.currentTags, hasChanges: true };
                        this.submitting = false;
                    } catch (error) {
                        console.error('Error fetching updated tags', error);
                        this.submitting = false;
                    }
                },
                (error) => {
                    console.error('Error deleting tag', error);
                },
            );
    }

    private openConfirmAPIRequestDialog(type: string, data = {}) {
        let message: string;
        let title: string;

        switch (type) {
            case 'delete_tag_from_owner':
                title = 'Remove Tag?';
                message = 'This will remove the tag from this license';
                break;
        }

        return this._confirmDialog.warning({ message: title, data: message });
    }

    private searchTags(keyword: string = null): void {
        this.isSearchingTags = true;

        const params: { keyword: string; role?: number } = { keyword };

        if (this._isDealer()) {
            params.role = 2;
        } else if (this._isDealerAdmin()) {
            params.role = 3;
        } else {
            params.role = 1;
        }

        this._tag
            .searchAllTags(params)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                ({ tags, message }) => {
                    if (message) return;
                    const merged = this._existingTagsControl.value.concat(tags);

                    const searchResults: TAG[] = merged.filter(
                        (tag, index, merged) => merged.findIndex((mergedTag) => mergedTag.name === tag.name) === index,
                    );

                    const tagsToRemove = this.currentTags;

                    const filtered = searchResults.filter(
                        (result) => !tagsToRemove.find((tagToRemove) => tagToRemove.tagId === result.tagId),
                    );

                    this.filteredTags.next(filtered);
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.isSearchingTags = false));
    }

    private subscribeToTagSearch(): void {
        const control = this._tagFilterControl;

        control.valueChanges
            .pipe(
                takeUntil(this._unsubscribe),
                debounceTime(1000),
                map((keyword) => {
                    if (control.invalid) return;

                    if (keyword && keyword.trim().length > 0) this.searchTags(keyword);
                    else this.getAllRecentTags();
                }),
            )
            .subscribe(() => (this.tagMultiSelect.compareWith = (a, b) => a && b && a.tagId === b.tagId));
    }

    protected getFormControl(name: string) {
        return this.form.get(name);
    }

    protected get _currentUser() {
        return this._auth.current_user_value;
    }

    protected get _formControls() {
        return {
            description: [null],
            exclude: [false],
            existing: [[]],
            name: [null, Validators.required],
            new: [[]],
            tagColor: [null, Validators.required],
            tagFilter: [null],
        };
    }

    protected get _excludeTagControl() {
        return this.getFormControl('exclude');
    }

    protected get _existingTagsControl() {
        return this.getFormControl('existing');
    }

    protected get _newTagsControl() {
        return this.getFormControl('new');
    }

    protected get _tagColorControl() {
        return this.getFormControl('tagColor');
    }

    protected get _tagDescriptionControl() {
        return this.getFormControl('description');
    }

    protected get _tagFilterControl() {
        return this.getFormControl('tagFilter');
    }

    protected get _tagNameControl() {
        return this.getFormControl('name');
    }

    _isDealer() {
        const DEALER_ROLES = ['dealer', 'sub-dealer'];
        return DEALER_ROLES.includes(this._auth.current_role);
    }

    _isDealerAdmin() {
        return this._auth.current_role === 'dealeradmin';
    }

    _isAdmin() {
        return this._auth.current_role === 'administrator';
    }
}
