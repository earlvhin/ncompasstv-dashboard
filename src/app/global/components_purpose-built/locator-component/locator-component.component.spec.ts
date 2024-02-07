import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocatorComponentComponent } from './locator-component.component';

describe('LocatorComponentComponent', () => {
    let component: LocatorComponentComponent;
    let fixture: ComponentFixture<LocatorComponentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LocatorComponentComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LocatorComponentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
