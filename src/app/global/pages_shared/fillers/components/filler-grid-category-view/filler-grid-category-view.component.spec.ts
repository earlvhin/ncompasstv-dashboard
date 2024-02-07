import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillerGridCategoryViewComponent } from './filler-grid-category-view.component';

describe('FillerGridCategoryViewComponent', () => {
    let component: FillerGridCategoryViewComponent;
    let fixture: ComponentFixture<FillerGridCategoryViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FillerGridCategoryViewComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FillerGridCategoryViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
