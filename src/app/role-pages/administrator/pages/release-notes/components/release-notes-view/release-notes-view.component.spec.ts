import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleaseNotesViewComponent } from './release-notes-view.component';

describe('ReleaseNotesViewComponent', () => {
    let component: ReleaseNotesViewComponent;
    let fixture: ComponentFixture<ReleaseNotesViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ReleaseNotesViewComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ReleaseNotesViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
