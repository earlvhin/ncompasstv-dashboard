import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignLicenseModalComponent } from './assign-license-modal.component';

describe('AssignLicenseModalComponent', () => {
    let component: AssignLicenseModalComponent;
    let fixture: ComponentFixture<AssignLicenseModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AssignLicenseModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignLicenseModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
