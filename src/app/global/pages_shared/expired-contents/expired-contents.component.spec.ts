import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiredContentsComponent } from './expired-contents.component';

describe('ExpiredContentsComponent', () => {
    let component: ExpiredContentsComponent;
    let fixture: ComponentFixture<ExpiredContentsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ExpiredContentsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ExpiredContentsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
