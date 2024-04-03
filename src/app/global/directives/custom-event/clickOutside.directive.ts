import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Directive, ElementRef, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Directive({
    selector: '[clickOutside]',
})
export class ClickOutsideDirective implements AfterViewInit, OnDestroy {
    @Output() on_click_outside = new EventEmitter<void>();

    private documentClickSubscription: Subscription | undefined;

    constructor(
        private element: ElementRef,
        @Inject(DOCUMENT) private document: Document,
    ) {}

    ngAfterViewInit(): void {
        this.documentClickSubscription = fromEvent(this.document, 'click')
            .pipe(
                filter((event) => {
                    return !this.isInside(event.target as HTMLElement);
                }),
            )
            .subscribe(() => {
                this.on_click_outside.emit();
            });
    }

    ngOnDestroy(): void {
        if (typeof this.documentClickSubscription === undefined) return;
        this.documentClickSubscription.unsubscribe();
    }

    isInside(elementToCheck: HTMLElement): boolean {
        return elementToCheck === this.element.nativeElement || this.element.nativeElement.contains(elementToCheck);
    }
}
