import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingsViewComponent } from './billings-view.component';

describe('BillingsViewComponent', () => {
    let component: BillingsViewComponent;
    let fixture: ComponentFixture<BillingsViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BillingsViewComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BillingsViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
