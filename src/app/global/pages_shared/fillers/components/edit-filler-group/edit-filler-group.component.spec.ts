import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFillerGroupComponent } from './edit-filler-group.component';

describe('EditFillerGroupComponent', () => {
    let component: EditFillerGroupComponent;
    let fixture: ComponentFixture<EditFillerGroupComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EditFillerGroupComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditFillerGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
