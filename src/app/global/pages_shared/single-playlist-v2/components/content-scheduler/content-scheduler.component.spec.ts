import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentSchedulerComponent } from './content-scheduler.component';

describe('ContentSchedulerComponent', () => {
    let component: ContentSchedulerComponent;
    let fixture: ComponentFixture<ContentSchedulerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ContentSchedulerComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContentSchedulerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
