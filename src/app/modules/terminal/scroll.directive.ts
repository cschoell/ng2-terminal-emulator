import {Directive, Inject, Input, OnInit, Renderer2, ViewContainerRef} from '@angular/core';
import {ScrollOptions} from './scroll-options.class';

@Directive({
  selector: '[slimScroll]'
})
export class ScrollDirective implements OnInit {
  @Input() options: ScrollOptions;

  private el: HTMLElement;
  private wrapper: HTMLElement;
  private grid: HTMLElement;
  private bar: HTMLElement;
  private body: HTMLElement;
  private pageY: number;
  private top: number;
  private dragging: boolean;
  private mutationThrottleTimeout: any;
  private mutationObserver: MutationObserver;

  constructor(
    @Inject(ViewContainerRef) private viewContainer: ViewContainerRef,
    @Inject(Renderer2) private renderer: Renderer2) {
    if (typeof window === 'undefined') {
      return;
    }
    this.viewContainer = viewContainer;
    this.el = viewContainer.element.nativeElement;
    this.body = document.documentElement.querySelector('body');
    this.mutationThrottleTimeout = 50;
  }

  ngOnInit() {
    if (typeof window === 'undefined') {
      return;
    }
    this.options = new ScrollOptions(this.options);
    this.destroy();
    this.setStyle();
    this.wrapContainer();
    this.initGrid();
    this.initBar();
    this.getBarHeight();
    this.attachWheel(this.el);
    this.makeBarDraggable();

    if (MutationObserver) {
      this.mutationObserver = new MutationObserver(() => {
        if (this.mutationThrottleTimeout) {
          clearTimeout(this.mutationThrottleTimeout);
          this.mutationThrottleTimeout = setTimeout(this.onMutation.bind(this), 50);
        }
      });
      this.mutationObserver.observe(this.el, {subtree: true, childList: true});
    }
  }

  private setStyle(): void {
    const el = this.el;
    this.renderer.setStyle(el, 'overflow', 'hidden');
    this.renderer.setStyle(el, 'position', 'relative');
    this.renderer.setStyle(el, 'display', 'block');
  }

  private onMutation() {
    this.getBarHeight();
  }

  private wrapContainer(): void {
    this.wrapper = document.createElement('div');
    const wrapper = this.wrapper;
    const el = this.el;

    this.renderer.setAttribute(wrapper, 'class', 'slimscroll-wrapper');
    this.renderer.setStyle(wrapper, 'position', 'relative');
    this.renderer.setStyle(wrapper, 'overflow', 'hidden');
    this.renderer.setStyle(wrapper, 'display', 'block');
    this.renderer.setStyle(wrapper, 'margin', getComputedStyle(el).margin);
    this.renderer.setStyle(wrapper, 'width', getComputedStyle(el).width);
    this.renderer.setStyle(wrapper, 'height', getComputedStyle(el).height);

    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  private initGrid(): void {
    this.grid = document.createElement('div');
    const grid = this.grid;

    this.renderer.setAttribute(grid, 'class', 'slimscroll-grid');
    this.renderer.setStyle(grid, 'position', 'absolute');
    this.renderer.setStyle(grid, 'top', '0');
    this.renderer.setStyle(grid, this.options.position, '0');
    this.renderer.setStyle(grid, 'width', `${this.options.gridWidth}px`);
    this.renderer.setStyle(grid, 'height', '100%');
    this.renderer.setStyle(grid, 'background', this.options.gridBackground);
    this.renderer.setStyle(grid, 'opacity', this.options.gridOpacity);
    this.renderer.setStyle(grid, 'display', 'block');
    this.renderer.setStyle(grid, 'cursor', 'pointer');
    this.renderer.setStyle(grid, 'z-index', '99');
    this.renderer.setStyle(grid, 'border-radius', `${this.options.gridBorderRadius}px`);
    this.renderer.setStyle(grid, 'margin', this.options.gridMargin);

    this.wrapper.appendChild(grid);
  }

  private initBar(): void {
    this.bar = document.createElement('div');
    const bar = this.bar;
    const el = this.el;

    this.renderer.setAttribute(bar, 'class', 'slimscroll-bar');
    this.renderer.setStyle(bar, 'position', 'absolute');
    this.renderer.setStyle(bar, 'top', '0');
    this.renderer.setStyle(bar, this.options.position, '0');
    this.renderer.setStyle(bar, 'width', `${this.options.barWidth}px`);
    this.renderer.setStyle(bar, 'background', this.options.barBackground);
    this.renderer.setStyle(bar, 'opacity', this.options.barOpacity);
    this.renderer.setStyle(bar, 'display', 'block');
    this.renderer.setStyle(bar, 'cursor', 'pointer');
    this.renderer.setStyle(bar, 'z-index', '100');
    this.renderer.setStyle(bar, 'border-radius', `${this.options.barBorderRadius}px`);
    this.renderer.setStyle(bar, 'margin', this.options.barMargin);

    this.wrapper.appendChild(bar);
  }

  private getBarHeight(): void {
    setTimeout(() => {
      const barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30) + 'px';
      const display = parseInt(barHeight, 10) === this.el.offsetHeight ? 'none' : 'block';

      this.renderer.setStyle(this.bar, 'height', barHeight);
      this.renderer.setStyle(this.bar, 'display', display);
    }, 1);
  }

  private attachWheel(target: HTMLElement): void {
    target.addEventListener('DOMMouseScroll', this.onWheel, false);
    target.addEventListener('mousewheel', this.onWheel, false);
  }

  private onWheel = (e: Event) => {
    if (e instanceof WheelEvent) {
      let delta = 0;
      const target = e.target || e.srcElement;

      if (e.deltaY) {
        delta = e.deltaY / 120;
      }
      if (e.detail) {
        delta = e.detail / 3;
      }

      this.scrollContent(delta, true, false);

      if (e.preventDefault) {
        e.preventDefault();
      }
    }
  };

  private scrollContent(y: number, isWheel: boolean, isJump: boolean): void {
    let delta = y;
    const maxTop = this.el.offsetHeight - this.bar.offsetHeight;
    let percentScroll: number;
    const bar = this.bar;
    const el = this.el;

    if (isWheel) {
      delta = parseInt(getComputedStyle(bar).bottom, 10) + y * 20 / 100 * bar.offsetHeight;
      delta = Math.min(Math.max(delta, 0), maxTop);
      delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);
      this.renderer.setStyle(bar, 'top', delta + 'px');
    }

    percentScroll = parseInt(getComputedStyle(bar).top, 10) / (el.offsetHeight - bar.offsetHeight);
    delta = percentScroll * (el.scrollHeight - el.offsetHeight);

    el.scrollTop = delta;
  }

  private makeBarDraggable = () => {
    const body = document.getElementsByTagName('body')[0];
    const el = this.el;
    const bar = this.bar;

    bar.addEventListener('mousedown', (e: MouseEvent) => {
      if (!this.dragging) {
        this.pageY = e.pageY;
        this.top = parseFloat(getComputedStyle(this.bar).top);
      }

      this.dragging = true;
      this.body.addEventListener('mousemove', this.barDraggableListener, false);
      this.body.addEventListener('selectstart', this.preventDefaultEvent, false);
    }, false);

    this.body.addEventListener('mouseup', () => {
      this.body.removeEventListener('mousemove', this.barDraggableListener, false);
      this.body.removeEventListener('selectstart', this.preventDefaultEvent, false);
      this.dragging = false;
    }, false);
  };

  private preventDefaultEvent = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  private barDraggableListener = (e: MouseEvent) => {
    const top = this.top + e.pageY - this.pageY;
    this.renderer.setStyle(this.bar, 'top', `${top}px`);
    this.scrollContent(0, true, false);
  };

  private destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // @ts-ignore
    if (this.el.parentElement.classList.contains('slimscroll-wrapper')) {
      const wrapper = this.el.parentElement;
      const bar = this.el.querySelector('.slimscroll-bar');
      // @ts-ignore
      this.el.removeChild(bar);
      // @ts-ignore
      this.unwrap(wrapper);
    }
  }

  private unwrap(wrapper: HTMLElement): void {
    const docFrag = document.createDocumentFragment();
    while (wrapper.firstChild) {
      const child = wrapper.removeChild(wrapper.firstChild);
      docFrag.appendChild(child);
    }
    wrapper.parentNode.replaceChild(docFrag, wrapper);
  }
}
