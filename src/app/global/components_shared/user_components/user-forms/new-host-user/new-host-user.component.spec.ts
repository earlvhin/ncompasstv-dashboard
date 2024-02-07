import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewHostUserComponent } from './new-host-user.component';

describe('NewHostUserComponent', () => {
    let component: NewHostUserComponent;
    let fixture: ComponentFixture<NewHostUserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NewHostUserComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NewHostUserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
