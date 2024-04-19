import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePlayerBackgroundComponent } from './update-player-background.component';

describe('UpdatePlayerBackgroundComponent', () => {
    let component: UpdatePlayerBackgroundComponent;
    let fixture: ComponentFixture<UpdatePlayerBackgroundComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UpdatePlayerBackgroundComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UpdatePlayerBackgroundComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
