import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridViewLicenseComponent } from './grid-view-license.component';

describe('GridViewLicenseComponent', () => {
    let component: GridViewLicenseComponent;
    let fixture: ComponentFixture<GridViewLicenseComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [GridViewLicenseComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GridViewLicenseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
