import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleActivityTabComponent } from './single-activity-tab.component';

describe('SingleActivityTabComponent', () => {
  let component: SingleActivityTabComponent;
  let fixture: ComponentFixture<SingleActivityTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleActivityTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleActivityTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
