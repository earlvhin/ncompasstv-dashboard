import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportTabComponent } from './support-tab.component';

describe('SupportTabComponent', () => {
    let component: SupportTabComponent;
    let fixture: ComponentFixture<SupportTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SupportTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SupportTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
