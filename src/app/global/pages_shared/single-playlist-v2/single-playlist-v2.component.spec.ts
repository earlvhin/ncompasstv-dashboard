import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SinglePlaylistV2Component } from './single-playlist-v2.component';

describe('SinglePlaylistV2Component', () => {
    let component: SinglePlaylistV2Component;
    let fixture: ComponentFixture<SinglePlaylistV2Component>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SinglePlaylistV2Component],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SinglePlaylistV2Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
