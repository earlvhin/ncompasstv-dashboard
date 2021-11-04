import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagesTabComponent } from './images-tab.component';

describe('ImagesTabComponent', () => {
  let component: ImagesTabComponent;
  let fixture: ComponentFixture<ImagesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImagesTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
