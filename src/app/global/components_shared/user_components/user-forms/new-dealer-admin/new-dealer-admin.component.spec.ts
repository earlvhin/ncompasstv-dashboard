import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDealerAdminComponent } from './new-dealer-admin.component';

describe('NewDealerAdminComponent', () => {
    let component: NewDealerAdminComponent;
    let fixture: ComponentFixture<NewDealerAdminComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NewDealerAdminComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NewDealerAdminComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
