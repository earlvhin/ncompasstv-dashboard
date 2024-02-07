import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LicensesTabReportsComponent } from './licenses-tab-reports.component';

describe('LicensesTabReportsComponent', () => {
    let component: LicensesTabReportsComponent;
    let fixture: ComponentFixture<LicensesTabReportsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LicensesTabReportsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LicensesTabReportsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
