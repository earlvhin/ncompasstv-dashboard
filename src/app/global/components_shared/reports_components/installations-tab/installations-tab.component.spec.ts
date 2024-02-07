import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallationsTabComponent } from './installations-tab.component';

describe('InstallationsTabComponent', () => {
    let component: InstallationsTabComponent;
    let fixture: ComponentFixture<InstallationsTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InstallationsTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InstallationsTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
