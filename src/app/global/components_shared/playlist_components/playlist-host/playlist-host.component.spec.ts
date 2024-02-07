import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistHostComponent } from './playlist-host.component';

describe('PlaylistHostComponent', () => {
    let component: PlaylistHostComponent;
    let fixture: ComponentFixture<PlaylistHostComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlaylistHostComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlaylistHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
