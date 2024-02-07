import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistCreatedModalComponent } from './playlist-created-modal.component';

describe('PlaylistCreatedModalComponent', () => {
    let component: PlaylistCreatedModalComponent;
    let fixture: ComponentFixture<PlaylistCreatedModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlaylistCreatedModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlaylistCreatedModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
