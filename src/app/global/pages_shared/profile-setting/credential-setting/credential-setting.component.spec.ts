import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CredentialSettingComponent } from './credential-setting.component';

describe('CredentialSettingComponent', () => {
    let component: CredentialSettingComponent;
    let fixture: ComponentFixture<CredentialSettingComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CredentialSettingComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CredentialSettingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
