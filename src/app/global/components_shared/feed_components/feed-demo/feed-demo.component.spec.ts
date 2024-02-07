import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedDemoComponent } from './feed-demo.component';

describe('FeedDemoComponent', () => {
    let component: FeedDemoComponent;
    let fixture: ComponentFixture<FeedDemoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FeedDemoComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FeedDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
