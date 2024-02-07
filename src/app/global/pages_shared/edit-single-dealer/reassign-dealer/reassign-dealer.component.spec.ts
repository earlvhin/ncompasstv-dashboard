import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReassignDealerComponent } from './reassign-dealer.component';

describe('ReassignDealerComponent', () => {
    let component: ReassignDealerComponent;
    let fixture: ComponentFixture<ReassignDealerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ReassignDealerComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ReassignDealerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
