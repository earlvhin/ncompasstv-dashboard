import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSingleDealerComponent } from './edit-single-dealer.component';

describe('EditSingleDealerComponent', () => {
    let component: EditSingleDealerComponent;
    let fixture: ComponentFixture<EditSingleDealerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EditSingleDealerComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditSingleDealerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
