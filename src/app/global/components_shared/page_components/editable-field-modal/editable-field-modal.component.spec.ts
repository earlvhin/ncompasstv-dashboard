import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableFieldModalComponent } from './editable-field-modal.component';

describe('EditableFieldModalComponent', () => {
    let component: EditableFieldModalComponent;
    let fixture: ComponentFixture<EditableFieldModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EditableFieldModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditableFieldModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
