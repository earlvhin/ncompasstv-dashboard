import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFillerFeedsComponent } from './add-filler-feeds.component';

describe('AddFillerFeedsComponent', () => {
  let component: AddFillerFeedsComponent;
  let fixture: ComponentFixture<AddFillerFeedsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFillerFeedsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFillerFeedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
