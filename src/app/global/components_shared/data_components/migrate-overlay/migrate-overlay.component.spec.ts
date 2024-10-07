import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MigrateOverlayComponent } from './migrate-overlay.component';

describe('MigrateOverlayComponent', () => {
    let component: MigrateOverlayComponent;
    let fixture: ComponentFixture<MigrateOverlayComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MigrateOverlayComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MigrateOverlayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
