import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCustomHostFieldsComponent } from './create-custom-host-fields.component';

describe('CreateCustomHostFieldsComponent', () => {
    let component: CreateCustomHostFieldsComponent;
    let fixture: ComponentFixture<CreateCustomHostFieldsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CreateCustomHostFieldsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateCustomHostFieldsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
