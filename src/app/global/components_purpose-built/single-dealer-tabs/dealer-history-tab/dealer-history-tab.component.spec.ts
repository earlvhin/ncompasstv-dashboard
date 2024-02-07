import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerHistoryTabComponent } from './dealer-history-tab.component';

describe('DealerHistoryTabComponent', () => {
    let component: DealerHistoryTabComponent;
    let fixture: ComponentFixture<DealerHistoryTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerHistoryTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerHistoryTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
