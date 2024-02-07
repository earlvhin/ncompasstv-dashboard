import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistMediaThumbnailComponent } from './playlist-media-thumbnail.component';

describe('PlaylistMediaThumbnailComponent', () => {
    let component: PlaylistMediaThumbnailComponent;
    let fixture: ComponentFixture<PlaylistMediaThumbnailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlaylistMediaThumbnailComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlaylistMediaThumbnailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
