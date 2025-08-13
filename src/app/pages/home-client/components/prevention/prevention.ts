import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-prevention',
  imports: [],
  templateUrl: './prevention.html',
  styleUrl: './prevention.css'
})
export class Prevention {
constructor(private route: ActivatedRoute, private scroller: ViewportScroller) {}

ngOnInit() {
  this.route.fragment.subscribe(fragment => {
    if (fragment) {
      setTimeout(() => {
        this.scroller.scrollToAnchor(fragment);
      }, 100);
    }
  });
}
}
