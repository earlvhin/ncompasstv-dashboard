import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FailAnimationComponent } from './fail-animation.component';

describe('FailAnimationComponent', () => {
    let component: FailAnimationComponent;
    let fixture: ComponentFixture<FailAnimationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FailAnimationComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FailAnimationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
