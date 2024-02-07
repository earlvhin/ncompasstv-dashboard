import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSortModalComponent } from './user-sort-modal.component';

describe('UserSortModalComponent', () => {
    let component: UserSortModalComponent;
    let fixture: ComponentFixture<UserSortModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UserSortModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UserSortModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
