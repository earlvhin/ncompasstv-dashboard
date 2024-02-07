import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateMinimapComponent } from './template-minimap.component';

describe('TemplateMinimapComponent', () => {
    let component: TemplateMinimapComponent;
    let fixture: ComponentFixture<TemplateMinimapComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TemplateMinimapComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TemplateMinimapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
