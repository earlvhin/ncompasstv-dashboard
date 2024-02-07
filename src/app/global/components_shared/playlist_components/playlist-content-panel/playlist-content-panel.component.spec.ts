import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistContentPanelComponent } from './playlist-content-panel.component';

describe('PlaylistContentPanelComponent', () => {
    let component: PlaylistContentPanelComponent;
    let fixture: ComponentFixture<PlaylistContentPanelComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlaylistContentPanelComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlaylistContentPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
