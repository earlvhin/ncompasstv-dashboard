import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvertiserAutocompleteComponent } from './advertiser-autocomplete.component';

describe('AdvertiserAutocompleteComponent', () => {
    let component: AdvertiserAutocompleteComponent;
    let fixture: ComponentFixture<AdvertiserAutocompleteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdvertiserAutocompleteComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdvertiserAutocompleteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
