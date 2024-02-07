import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSingleHostComponent } from './edit-single-host.component';

describe('EditSingleHostComponent', () => {
    let component: EditSingleHostComponent;
    let fixture: ComponentFixture<EditSingleHostComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EditSingleHostComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditSingleHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
