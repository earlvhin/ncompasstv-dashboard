import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePlaylistContentComponent } from './create-playlist-content.component';

describe('CreatePlaylistContentComponent', () => {
    let component: CreatePlaylistContentComponent;
    let fixture: ComponentFixture<CreatePlaylistContentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CreatePlaylistContentComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreatePlaylistContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
