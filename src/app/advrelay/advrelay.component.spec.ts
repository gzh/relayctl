import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvrelayComponent } from './advrelay.component';

describe('AdvrelayComponent', () => {
  let component: AdvrelayComponent;
  let fixture: ComponentFixture<AdvrelayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdvrelayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvrelayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
