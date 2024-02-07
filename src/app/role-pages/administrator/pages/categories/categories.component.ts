import { Component, OnInit, ViewChild } from '@angular/core';
import { API_CATEGORY } from 'src/app/global/models/api_category.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material';
import { CategoryService } from '../../../../global/services/category-service/category.service';
import { CategoryModalComponent } from '../../../../global/components_shared/category_components/category-modal/category-modal.component';

@Component({
    selector: 'app-categories',
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
    title: string = 'Categories';
    categories$: Observable<API_CATEGORY[]>;
    category_data: Array<object> = [];

    constructor(
        private _http: HttpClient,
        private _auth: AuthService,
        private _category: CategoryService,
        private _dialog: MatDialog,
    ) {}

    category_table_column = ['#', 'Name', 'Parent Category'];

    ngOnInit() {
        this.getCategories();
        this.category_data;
    }

    getCategories() {
        this.categories$ = this._category.get_categories();
        this.categories$.subscribe(
            (data: API_CATEGORY[]) => {
                let count = 1;
                data.forEach((c) => {
                    const category_data = {
                        unique_key: c.slug,
                        i: count,
                        name: c.categoryName,
                        parent: c.parentCategory || '---',
                    };
                    this.category_data.push(category_data);
                    count++;
                });
            },
            (error) => {
                console.error(error);
            },
        );
    }

    openCreateCategoryModal(): void {
        this._dialog.open(CategoryModalComponent, {
            width: '600px',
        });
    }
}
