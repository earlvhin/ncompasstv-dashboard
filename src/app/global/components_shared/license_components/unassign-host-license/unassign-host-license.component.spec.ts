import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignHostLicenseComponent } from './unassign-host-license.component';

describe('UnassignHostLicenseComponent', () => {
    let component: UnassignHostLicenseComponent;
    let fixture: ComponentFixture<UnassignHostLicenseComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UnassignHostLicenseComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UnassignHostLicenseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
