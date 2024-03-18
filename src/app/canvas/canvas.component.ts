import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvas') private canvas: ElementRef;
  constructor() {}
  mode: string = 'pen';
  height: number = 400;
  width: number = 400;
  color: string = 'black';
  lineWidth: number = 5;
  ctx: CanvasRenderingContext2D;
  mouseDown$: Observable<Event>;
  mouseMove$: Observable<Event>;
  mouseUp$: Observable<Event>;
  mouseLeave$: Observable<Event>;

  ngAfterViewInit(): void {
    const canvasEl = this.canvas.nativeElement;
    // accessing its context
    this.ctx = canvasEl.getContext('2d');

    // height and width
    canvasEl.height = this.height;
    canvasEl.width = this.width;

    // setting lineWidth,color and cap
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.color;

    // handle rxjs
    this.handleRxJS(canvasEl);
  }

  handleRxJS(el: HTMLCanvasElement) {
    this.mouseDown$ = fromEvent(el, 'mousedown');
    this.mouseMove$ = fromEvent(el, 'mousemove');
    this.mouseUp$ = fromEvent(el, 'mouseup');
    this.mouseLeave$ = fromEvent(el, 'mouseleave');

    let draw$ = this.mouseDown$.pipe(
      switchMap((downs) => {
        return this.mouseMove$.pipe(
          takeUntil(this.mouseUp$),
          takeUntil(this.mouseLeave$),
          pairwise()
        );
      })
    );

    draw$.subscribe((res: [MouseEvent, MouseEvent]) => {
      const rect = el.getBoundingClientRect();
      const prevCoords = {
        x: res[0].clientX - rect.left,
        y: res[0].clientY - rect.top,
      };
      const currCoords = {
        x: res[1].clientX - rect.left,
        y: res[1].clientY - rect.top,
      };
      this.drawOnCanvas(prevCoords, currCoords);
    });
  }

  drawOnCanvas(prev, curr) {
    let { x: x1, y: y1 } = prev;
    let { x: x2, y: y2 } = curr;

    // if some case we have no ctx assigned
    if (!this.ctx) {
      return;
    }
    this.ctx.beginPath();
    if (this.mode == 'pen') {
      this.ctx.globalCompositeOperation = 'source-over';
      // start drawing

      // if x1 y1 is present
      if (x1 && y1) {
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);

        this.ctx.stroke();
      }
    } else {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.arc(x1, y1, 8, 0, Math.PI * 2, false);
      this.ctx.fill();
    }
  }
}
