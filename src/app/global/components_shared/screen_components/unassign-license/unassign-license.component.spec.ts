import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignLicenseComponent } from './unassign-license.component';

describe('UnassignLicenseComponent', () => {
    let component: UnassignLicenseComponent;
    let fixture: ComponentFixture<UnassignLicenseComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UnassignLicenseComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UnassignLicenseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
