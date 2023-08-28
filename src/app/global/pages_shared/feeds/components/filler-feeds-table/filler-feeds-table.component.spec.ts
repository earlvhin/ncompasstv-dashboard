import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillerFeedsTableComponent } from './filler-feeds-table.component';

describe('FillerFeedsTableComponent', () => {
  let component: FillerFeedsTableComponent;
  let fixture: ComponentFixture<FillerFeedsTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FillerFeedsTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FillerFeedsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
