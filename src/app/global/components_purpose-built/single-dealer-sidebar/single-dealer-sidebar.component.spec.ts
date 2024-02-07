import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleDealerSidebarComponent } from './single-dealer-sidebar.component';

describe('SingleDealerSidebarComponent', () => {
    let component: SingleDealerSidebarComponent;
    let fixture: ComponentFixture<SingleDealerSidebarComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SingleDealerSidebarComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleDealerSidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
