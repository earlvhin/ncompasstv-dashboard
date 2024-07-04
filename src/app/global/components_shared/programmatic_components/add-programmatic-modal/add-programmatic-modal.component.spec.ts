import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProgrammaticModalComponent } from './add-programmatic-modal.component';

describe('AddProgrammaticModalComponent', () => {
    let component: AddProgrammaticModalComponent;
    let fixture: ComponentFixture<AddProgrammaticModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddProgrammaticModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddProgrammaticModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
