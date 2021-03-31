import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistMediaComponent } from './playlist-media.component';

describe('PlaylistMediaComponent', () => {
  let component: PlaylistMediaComponent;
  let fixture: ComponentFixture<PlaylistMediaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaylistMediaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
