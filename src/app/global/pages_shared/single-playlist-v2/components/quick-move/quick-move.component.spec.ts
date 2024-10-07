import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickMoveComponent } from './quick-move.component';

describe('QuickMoveComponent', () => {
    let component: QuickMoveComponent;
    let fixture: ComponentFixture<QuickMoveComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [QuickMoveComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickMoveComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
