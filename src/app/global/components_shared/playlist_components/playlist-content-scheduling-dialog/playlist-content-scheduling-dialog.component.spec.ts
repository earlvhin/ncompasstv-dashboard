import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistContentSchedulingDialogComponent } from './playlist-content-scheduling-dialog.component';

describe('PlaylistContentSchedulingDialogComponent', () => {
    let component: PlaylistContentSchedulingDialogComponent;
    let fixture: ComponentFixture<PlaylistContentSchedulingDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlaylistContentSchedulingDialogComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlaylistContentSchedulingDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
