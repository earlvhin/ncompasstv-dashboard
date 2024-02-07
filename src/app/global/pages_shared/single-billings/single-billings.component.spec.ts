import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleBillingsComponent } from './single-billings.component';

describe('SingleBillingsComponent', () => {
    let component: SingleBillingsComponent;
    let fixture: ComponentFixture<SingleBillingsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SingleBillingsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleBillingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
