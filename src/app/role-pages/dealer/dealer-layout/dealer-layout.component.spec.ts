import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerLayoutComponent } from './dealer-layout.component';

describe('DealerLayoutComponent', () => {
    let component: DealerLayoutComponent;
    let fixture: ComponentFixture<DealerLayoutComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerLayoutComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
