import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedMediaComponent } from './feed-media.component';

describe('FeedMediaComponent', () => {
    let component: FeedMediaComponent;
    let fixture: ComponentFixture<FeedMediaComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FeedMediaComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FeedMediaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
