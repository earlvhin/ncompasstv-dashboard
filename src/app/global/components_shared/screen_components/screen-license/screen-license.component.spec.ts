import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenLicenseComponent } from './screen-license.component';

describe('ScreenLicenseComponent', () => {
    let component: ScreenLicenseComponent;
    let fixture: ComponentFixture<ScreenLicenseComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ScreenLicenseComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ScreenLicenseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
