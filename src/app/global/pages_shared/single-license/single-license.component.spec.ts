import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleLicenseComponent } from './single-license.component';

describe('SingleLicenseComponent', () => {
    let component: SingleLicenseComponent;
    let fixture: ComponentFixture<SingleLicenseComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SingleLicenseComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleLicenseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
