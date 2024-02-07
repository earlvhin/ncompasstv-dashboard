import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoZoneComponent } from './demo-zone.component';

describe('DemoZoneComponent', () => {
    let component: DemoZoneComponent;
    let fixture: ComponentFixture<DemoZoneComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DemoZoneComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DemoZoneComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
