import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerMapTabComponent } from './dealer-map-tab.component';

describe('DealerMapTabComponent', () => {
    let component: DealerMapTabComponent;
    let fixture: ComponentFixture<DealerMapTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerMapTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerMapTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
