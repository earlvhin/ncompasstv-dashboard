import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleDealerComponent } from './single-dealer.component';

describe('SingleDealerComponent', () => {
    let component: SingleDealerComponent;
    let fixture: ComponentFixture<SingleDealerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SingleDealerComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleDealerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
