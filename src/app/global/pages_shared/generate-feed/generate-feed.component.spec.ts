import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateFeedComponent } from './generate-feed.component';

describe('GenerateFeedComponent', () => {
    let component: GenerateFeedComponent;
    let fixture: ComponentFixture<GenerateFeedComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [GenerateFeedComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GenerateFeedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
