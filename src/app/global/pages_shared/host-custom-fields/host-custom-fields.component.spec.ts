import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HostCustomFieldsComponent } from './host-custom-fields.component';

describe('HostCustomFieldsComponent', () => {
    let component: HostCustomFieldsComponent;
    let fixture: ComponentFixture<HostCustomFieldsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HostCustomFieldsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HostCustomFieldsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
