import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteFillerFeedsComponent } from './delete-filler-feeds.component';

describe('DeleteFillerFeedsComponent', () => {
  let component: DeleteFillerFeedsComponent;
  let fixture: ComponentFixture<DeleteFillerFeedsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteFillerFeedsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteFillerFeedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
