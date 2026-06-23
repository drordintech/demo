import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnreportsupplierwiseComponent } from './grnreportsupplierwise.component';

describe('GrnreportsupplierwiseComponent', () => {
  let component: GrnreportsupplierwiseComponent;
  let fixture: ComponentFixture<GrnreportsupplierwiseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnreportsupplierwiseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrnreportsupplierwiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
