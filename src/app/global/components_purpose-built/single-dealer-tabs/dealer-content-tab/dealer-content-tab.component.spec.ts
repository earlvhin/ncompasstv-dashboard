import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerContentTabComponent } from './dealer-content-tab.component';

describe('DealerContentTabComponent', () => {
    let component: DealerContentTabComponent;
    let fixture: ComponentFixture<DealerContentTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerContentTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerContentTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
