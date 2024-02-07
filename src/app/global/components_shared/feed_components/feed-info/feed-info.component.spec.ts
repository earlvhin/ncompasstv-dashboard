import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedInfoComponent } from './feed-info.component';

describe('FeedInfoComponent', () => {
    let component: FeedInfoComponent;
    let fixture: ComponentFixture<FeedInfoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FeedInfoComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FeedInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
