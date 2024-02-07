import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePlaylistComponent } from './delete-playlist.component';

describe('DeletePlaylistComponent', () => {
    let component: DeletePlaylistComponent;
    let fixture: ComponentFixture<DeletePlaylistComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DeletePlaylistComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DeletePlaylistComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
