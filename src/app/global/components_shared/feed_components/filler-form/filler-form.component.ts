import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { FeedMediaComponent } from '../feed-media/feed-media.component';
import { Sortable, MultiDrag } from 'sortablejs';

@Component({
    selector: 'app-filler-form',
    templateUrl: './filler-form.component.html',
    styleUrls: ['./filler-form.component.scss'],
})
export class FillerFormComponent implements OnInit {
    @Input() selected_dealer: string;
    @Input() filler_global_settings: { feed_id: string; min: number; num: number };
    @Input() filler_items_structured: {
        contentId?: string;
        contents?: API_CONTENT;
        feedFillerId?: string;
        feedId?: string;
        sequence?: number;
    }[] = [];
    @Output() filler_data = new EventEmitter();
    @ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;

    filler_settings_form: FormGroup;
    filler_items: API_CONTENT[] = [];

    filler_fields = [
        {
            label: 'Transition Skip',
            form_control_name: 'num',
            type: 'number',
            colorValue: '',
            width: 'col-lg-6',
            required: true,
            value: 2,
            viewType: null,
        },
        {
            label: 'Transition Time in minutes',
            form_control_name: 'min',
            type: 'number',
            colorValue: '',
            width: 'col-lg-6',
            required: true,
            value: 30,
            viewType: null,
        },
    ];

    is_editing: boolean = false;
    selected_items: string[] = [];

    constructor(
        private _form: FormBuilder,
        private _dialog: MatDialog,
    ) {}

    ngOnInit() {
        this.prepareForms();

        /** Add Multidrag Feature */
        Sortable.mount(new MultiDrag());
    }

    /** Prepare Forms */
    private prepareForms(): void {
        let form_group_obj = {};

        /** Loop through form fields object and prepare for group */
        this.filler_fields.map((i) => {
            Object.assign(form_group_obj, {
                [i.form_control_name]: [i.value ? i.value : null, i.required ? Validators.required : null],
            });
        });

        this.filler_settings_form = this._form.group(form_group_obj);

        if (this.filler_global_settings) {
            this.f.num.setValue(this.filler_global_settings.num);
            this.f.min.setValue(this.filler_global_settings.min);

            if (this.filler_items_structured && this.filler_items_structured.length > 0) {
                this.filler_items_structured.map((v: API_CONTENT, i) => {
                    this.filler_items.push(v.contents);
                });

                this.is_editing = true;
                this.sortableJSInit();
            }
        }
    }

    /** Sortable JS Plugin Initialization */
    private sortableJSInit(): void {
        const set = (sortable) => {
            let sorted_filler_items = [];
            let sorted_filler_items_structured = [];

            sortable.toArray().forEach((i) => {
                this.filler_items.forEach((f, index) => {
                    if (i == f.contentId) {
                        sorted_filler_items.push(f);

                        sorted_filler_items_structured.push({
                            contentId: f.contentId,
                        });
                    }
                });
            });

            this.filler_items = sorted_filler_items;
            this.filler_items_structured = sorted_filler_items_structured;
        };

        setTimeout(() => {
            new Sortable(this.draggables.nativeElement, {
                swapThreshold: 1,
                sort: true,
                animation: 500,
                ghostClass: 'dragging',
                scrollSensitivity: 200,
                multiDrag: true,
                selectedClass: 'selected',
                fallbackOnBody: true,
                forceFallback: true,
                group: 'feed_content_items',
                fallbackTolerance: 10,
                store: { set },
            });
        }, 0);
    }

    /** Slide Global Settings Form Control Getter */
    private get f() {
        return this.filler_settings_form.controls;
    }

    /** Structured Filler Settings and Filler Items Data */
    passFillerData() {
        const payload = {
            feedFillerSettings: {
                num: this.f.num.value,
                min: this.f.min.value,
            },
            feedFillers: [
                ...this.filler_items_structured.map((v, i) => {
                    return {
                        contentId: v.contentId,
                        sequence: (i += 1),
                    };
                }),
            ],
        };

        this.filler_data.emit(payload);
    }

    selectedItem(f: API_CONTENT) {
        if (this.selected_items.includes(f.contentId)) {
            this.selected_items = this.selected_items.filter((i) => i !== f.contentId);
        } else {
            this.selected_items.push(f.contentId);
        }
    }

    removeFillerItem(i?: API_CONTENT, bulk?: boolean) {
        if (i && i.contentId) {
            this.filler_items_structured = this.filler_items_structured.filter((f) => f.contentId !== i.contentId);
            this.filler_items = this.filler_items.filter((f) => f.contentId !== i.contentId);
        }

        if (bulk) {
            this.selected_items.forEach((s) => {
                this.filler_items_structured = this.filler_items_structured.filter((f) => f.contentId !== s);
                this.filler_items = this.filler_items.filter((f) => f.contentId !== s);
            });

            this.selected_items = [];
        }
    }

    /** Open Media Library where contents are assigned to selected dealer */
    openMediaLibraryModal(form_control_name?: string): void {
        /** Open Feed Media Modal */
        let dialog = this._dialog.open(FeedMediaComponent, {
            width: '1024px',
            data: {
                dealer: this.selected_dealer,
                singleSelect: false,
            },
        });

        /** On Modal Close */
        dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
            if (data && data.length > 0) {
                this.filler_items.push(...data);

                data.forEach((v, i) => {
                    this.filler_items_structured.push({
                        contentId: v.contentId,
                    });
                });

                if (!this.is_editing) {
                    this.sortableJSInit();
                }
            }
        });
    }
}
