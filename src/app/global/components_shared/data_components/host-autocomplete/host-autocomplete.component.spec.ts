import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HostAutocompleteComponent } from './host-autocomplete.component';

describe('HostAutocompleteComponent', () => {
    let component: HostAutocompleteComponent;
    let fixture: ComponentFixture<HostAutocompleteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HostAutocompleteComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HostAutocompleteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
