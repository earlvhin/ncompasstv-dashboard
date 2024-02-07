import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseModalComponent } from './license-modal.component';

describe('LicenseModalComponent', () => {
    let component: LicenseModalComponent;
    let fixture: ComponentFixture<LicenseModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LicenseModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LicenseModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
