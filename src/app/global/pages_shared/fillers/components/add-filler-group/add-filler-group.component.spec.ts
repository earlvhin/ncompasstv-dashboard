import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFillerGroupComponent } from './add-filler-group.component';

describe('AddFillerGroupComponent', () => {
    let component: AddFillerGroupComponent;
    let fixture: ComponentFixture<AddFillerGroupComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddFillerGroupComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddFillerGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
