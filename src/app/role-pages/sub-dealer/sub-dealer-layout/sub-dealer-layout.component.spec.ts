import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubDealerLayoutComponent } from './sub-dealer-layout.component';

describe('SubDealerLayoutComponent', () => {
    let component: SubDealerLayoutComponent;
    let fixture: ComponentFixture<SubDealerLayoutComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SubDealerLayoutComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SubDealerLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
