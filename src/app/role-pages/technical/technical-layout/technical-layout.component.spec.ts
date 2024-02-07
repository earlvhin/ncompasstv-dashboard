import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalLayoutComponent } from './technical-layout.component';

describe('TechnicalLayoutComponent', () => {
    let component: TechnicalLayoutComponent;
    let fixture: ComponentFixture<TechnicalLayoutComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TechnicalLayoutComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TechnicalLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
