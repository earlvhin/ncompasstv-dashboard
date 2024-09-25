import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentSchedulerFormComponent } from './content-scheduler-form.component';

describe('ContentSchedulerFormComponent', () => {
    let component: ContentSchedulerFormComponent;
    let fixture: ComponentFixture<ContentSchedulerFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ContentSchedulerFormComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContentSchedulerFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
