import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayLocationItemComponent } from './play-location-item.component';

describe('PlayLocationItemComponent', () => {
    let component: PlayLocationItemComponent;
    let fixture: ComponentFixture<PlayLocationItemComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlayLocationItemComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayLocationItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
