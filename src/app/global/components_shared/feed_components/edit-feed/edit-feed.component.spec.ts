import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFeedComponent } from './edit-feed.component';

describe('EditFeedComponent', () => {
    let component: EditFeedComponent;
    let fixture: ComponentFixture<EditFeedComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EditFeedComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditFeedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
