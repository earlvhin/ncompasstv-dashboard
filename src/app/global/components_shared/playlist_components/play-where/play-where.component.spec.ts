import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayWhereComponent } from './play-where.component';

describe('PlayWhereComponent', () => {
    let component: PlayWhereComponent;
    let fixture: ComponentFixture<PlayWhereComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlayWhereComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayWhereComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
