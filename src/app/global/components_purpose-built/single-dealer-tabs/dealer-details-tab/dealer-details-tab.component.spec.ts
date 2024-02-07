import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerDetailsTabComponent } from './dealer-details-tab.component';

describe('DealerDetailsTabComponent', () => {
    let component: DealerDetailsTabComponent;
    let fixture: ComponentFixture<DealerDetailsTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerDetailsTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerDetailsTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
