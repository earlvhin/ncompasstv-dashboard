import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayLocationComponent } from './play-location.component';

describe('PlayLocationComponent', () => {
    let component: PlayLocationComponent;
    let fixture: ComponentFixture<PlayLocationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlayLocationComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayLocationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
