import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateZonesComponent } from './template-zones.component';

describe('TemplateZonesComponent', () => {
    let component: TemplateZonesComponent;
    let fixture: ComponentFixture<TemplateZonesComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TemplateZonesComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TemplateZonesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
