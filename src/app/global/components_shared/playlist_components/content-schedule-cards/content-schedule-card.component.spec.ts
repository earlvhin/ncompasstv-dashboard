import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentScheduleCardComponent } from './content-schedule-card.component';

describe('ContentScheduleCardsComponent', () => {
    let component: ContentScheduleCardComponent;
    let fixture: ComponentFixture<ContentScheduleCardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ContentScheduleCardComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContentScheduleCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
