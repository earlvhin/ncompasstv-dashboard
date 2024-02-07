import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-category-modal',
    templateUrl: './category-modal.component.html',
    styleUrls: ['./category-modal.component.scss'],
})
export class CategoryModalComponent implements OnInit {
    create_category_form: FormGroup;

    constructor(private _form: FormBuilder) {}

    ngOnInit() {
        this.prepareCategoryForm();
    }

    prepareCategoryForm() {
        this.create_category_form = this._form.group({
            categoryName: ['', Validators.required],
            slug: [''],
            parentCategory: [''],
        });
    }
}
