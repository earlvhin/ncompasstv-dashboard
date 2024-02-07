import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerHostTabComponent } from './dealer-host-tab.component';

describe('DealerHostTabComponent', () => {
    let component: DealerHostTabComponent;
    let fixture: ComponentFixture<DealerHostTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerHostTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerHostTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
