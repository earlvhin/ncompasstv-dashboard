import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFillerFeedComponent } from './create-filler-feed.component';

describe('CreateFillerFeedComponent', () => {
    let component: CreateFillerFeedComponent;
    let fixture: ComponentFixture<CreateFillerFeedComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CreateFillerFeedComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateFillerFeedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
