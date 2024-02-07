import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealersViewComponent } from './dealers-view.component';

describe('DealersViewComponent', () => {
    let component: DealersViewComponent;
    let fixture: ComponentFixture<DealersViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealersViewComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealersViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
