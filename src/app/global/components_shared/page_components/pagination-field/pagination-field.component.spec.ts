import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationFieldComponent } from './pagination-field.component';

describe('PaginationFieldComponent', () => {
    let component: PaginationFieldComponent;
    let fixture: ComponentFixture<PaginationFieldComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PaginationFieldComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PaginationFieldComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
