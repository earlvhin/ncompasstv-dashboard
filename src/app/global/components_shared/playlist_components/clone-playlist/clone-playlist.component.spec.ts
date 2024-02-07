import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClonePlaylistComponent } from './clone-playlist.component';

describe('ClonePlaylistComponent', () => {
    let component: ClonePlaylistComponent;
    let fixture: ComponentFixture<ClonePlaylistComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ClonePlaylistComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ClonePlaylistComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
