import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerAutocompleteComponent } from './dealer-autocomplete.component';

describe('DealerAutocompleteComponent', () => {
    let component: DealerAutocompleteComponent;
    let fixture: ComponentFixture<DealerAutocompleteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerAutocompleteComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerAutocompleteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
