import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallationTabComponent } from './installation-tab.component';

describe('InstallationTabComponent', () => {
    let component: InstallationTabComponent;
    let fixture: ComponentFixture<InstallationTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InstallationTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InstallationTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
