import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingInstallModalComponent } from './upcoming-install-modal.component';

describe('UpcomingInstallModalComponent', () => {
    let component: UpcomingInstallModalComponent;
    let fixture: ComponentFixture<UpcomingInstallModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UpcomingInstallModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UpcomingInstallModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
