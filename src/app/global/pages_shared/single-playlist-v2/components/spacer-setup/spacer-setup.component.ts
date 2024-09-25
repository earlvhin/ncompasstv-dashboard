import { Component, Inject, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { API_HOST, API_LICENSE } from 'src/app/global/models';

const DUMMY_AVAILABLE_CATEGORIES = [
    {
        categoryId: 1,
        categoryName: 'dealer',
        count: 3,
    },
    {
        categoryId: 2,
        categoryName: 'host',
        count: 2,
    },
    {
        categoryId: 3,
        categoryName: 'advertiser',
        count: 2,
    },
    {
        categoryId: 4,
        categoryName: 'fillers',
        count: 1,
    },
];

@Component({
    selector: 'app-spacer-setup',
    templateUrl: './spacer-setup.component.html',
    styleUrls: ['./spacer-setup.component.scss'],
})
export class SpacerSetupComponent implements OnInit {
    availableContentCategories = DUMMY_AVAILABLE_CATEGORIES;
    assignedLicenses = [];
    playlistHostLicenses: { host: API_HOST; licenses: API_LICENSE[] }[] = [];
    spacerInfo: FormGroup = this._form_builder.group({
        spacerName: ['', Validators.required],
        spacerDescription: ['', Validators.required],
        spacerAlgoFields: this._form_builder.array([]),
    });
    toggleAll: Subject<void> = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public _dialog_data: {
            hostLicenses: { host: API_HOST; licenses: API_LICENSE[] }[];
        },
        private _form_builder: FormBuilder,
    ) {
        this.setDynamicSpacerAlgoFields(this.availableContentCategories);
    }

    ngOnInit() {
        this.playlistHostLicenses = this._dialog_data.hostLicenses ? [...this._dialog_data.hostLicenses] : [];
    }

    public get dynamicSpacerAlgoFields() {
        return this.spacerInfo.get('spacerAlgoFields') as FormArray;
    }

    public getCategoryInfoByName(categoryName: string) {
        return this.availableContentCategories.filter((i) => i.categoryName == categoryName)[0];
    }

    public setDynamicSpacerAlgoFields(contentCategories: any[]) {
        /** Initialize dynamic spacer algo fields
         * @todo - fields added to the dynamic spacer algo fields form array
         * should be calculated based on the available categories on playlist contents in a playlist
         * If there's no playlist content set as dealer category, then the dealer field should not show up
         * the field name should also be set based from the category name assigned to the playlist content.
         */

        contentCategories.map((c: any) => {
            const contentCategoryBasedFields = {};

            Object.assign(contentCategoryBasedFields, {
                [c.categoryName]: [
                    0,
                    [
                        Validators.required,
                        this.numberRangeValidator.bind(this, this.getCategoryInfoByName(c.categoryName)),
                    ],
                ],
            });

            this.dynamicSpacerAlgoFields.push(this._form_builder.group(contentCategoryBasedFields));
        });
    }

    private numberRangeValidator(category: any, control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        const minNumber = 0;
        const maxNumber = category.count;
        if (value !== null && (isNaN(value) || value < minNumber || value > maxNumber)) {
            return { numberRange: true };
        }
        return null;
    }

    public licenseIdToggled(licenseIds: string[]) {
        this.assignedLicenses = licenseIds;
    }
}
