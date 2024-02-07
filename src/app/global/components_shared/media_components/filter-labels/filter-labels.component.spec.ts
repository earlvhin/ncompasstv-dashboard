import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterLabelsComponent } from './filter-labels.component';

describe('FilterLabelsComponent', () => {
    let component: FilterLabelsComponent;
    let fixture: ComponentFixture<FilterLabelsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FilterLabelsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterLabelsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
