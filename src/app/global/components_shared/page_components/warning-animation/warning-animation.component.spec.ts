import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WarningAnimationComponent } from './warning-animation.component';

describe('WarningAnimationComponent', () => {
    let component: WarningAnimationComponent;
    let fixture: ComponentFixture<WarningAnimationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [WarningAnimationComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WarningAnimationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
