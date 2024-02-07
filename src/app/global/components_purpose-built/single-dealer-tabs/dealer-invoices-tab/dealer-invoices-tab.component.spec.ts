import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerInvoicesTabComponent } from './dealer-invoices-tab.component';

describe('DealerInvoicesTabComponent', () => {
    let component: DealerInvoicesTabComponent;
    let fixture: ComponentFixture<DealerInvoicesTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerInvoicesTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerInvoicesTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
