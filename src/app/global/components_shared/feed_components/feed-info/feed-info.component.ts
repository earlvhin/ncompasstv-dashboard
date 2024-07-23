import { EventEmitter, HostListener, Output } from '@angular/core';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Location } from '@angular/common';

import { API_FEED_TYPES, API_GENERATED_FEED, GenerateSlideFeed, UI_AUTOCOMPLETE_DATA } from 'src/app/global/models';
import { AuthService, FeedService } from 'src/app/global/services';

@Component({
    selector: 'app-feed-info',
    templateUrl: './feed-info.component.html',
    styleUrls: ['./feed-info.component.scss'],
})
export class FeedInfoComponent implements OnInit, OnDestroy {
    @Input() dealers: { dealerId: string; businessName: string }[];
    @Input() editing: boolean = false;
    @Input() fetched_feed: API_GENERATED_FEED;
    @Input() feed_types: API_FEED_TYPES[];
    @Input() is_dealer: boolean = false;
    @Output() feed_info = new EventEmitter();
    @Output() formChanges: EventEmitter<boolean> = new EventEmitter<boolean>();

    autoCompleteSelectedDealer: UI_AUTOCOMPLETE_DATA[] = [];
    selectedDealer: { dealerId: string; businessName: string };
    dealerHasValue = false;
    existing: any;
    filtered_options: Observable<{ dealerId: string; businessName: string }[]>;
    generated_feed: GenerateSlideFeed;
    hasUnsavedChanges: boolean = false;
    isDealer = this._auth.current_role === 'dealer' || this._auth.current_role === 'sub-dealer';
    editingAsDealer = false;
    editHasValue = true;
    new_feed_form: FormGroup;
    selected_dealer: string;
    private formSubscription: Subscription;

    constructor(
        private _auth: AuthService,
        private _form: FormBuilder,
        private _feed: FeedService,
        private _location: Location,
    ) {}

    ngOnInit() {
        if (this.editing && this.fetched_feed) this.initialSelectedDealer();
        this.prepareFeedInfoForm();

        this.formSubscription = this.new_feed_form.valueChanges.subscribe((f) => {
            this.hasUnsavedChanges = this.checkForUnsavedChanges(f);
            this.formChanges.emit(this.hasUnsavedChanges);
            this.updateHasUnsavedChanges(this.hasUnsavedChanges);
        });

        if (this.isDealer) this.editingAsDealer = true;

        window.addEventListener('beforeunload', this.unloadNotification.bind(this));
    }

    ngOnDestroy() {
        window.removeEventListener('beforeunload', this.unloadNotification.bind(this));
        this.formSubscription.unsubscribe();
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any): void {
        if (this.hasUnsavedChanges) {
            $event.returnValue = true;
        }
    }

    private initialSelectedDealer(): void {
        if (this.fetched_feed && this.fetched_feed.dealer) {
            this.autoCompleteSelectedDealer.push({
                id: this.fetched_feed.dealer.dealerId,
                value: this.fetched_feed.dealer.businessName,
            });
        }
    }

    updateHasUnsavedChanges(value: boolean) {
        this._feed.setInputChanges(value);
    }

    structureFeedInfo() {
        const feedData = this.editing ? this.getEditingFeedData() : this.new_feed_form.value;
        this.feed_info.emit(feedData);
    }

    private getEditingFeedData() {
        return {
            feed_title: this.new_feed_form.controls.feed_title.value,
            description: this.new_feed_form.controls.description.value,
            feed_type: this.fetched_feed && this.fetched_feed.feedType ? this.fetched_feed.feedType.feedTypeId : null,
            assign_to_id: this.selectedDealer
                ? this.selectedDealer.dealerId
                : this.fetched_feed && this.fetched_feed.dealer
                  ? this.fetched_feed.dealer.dealerId
                  : null,
        };
    }

    private checkForUnsavedChanges(formValue: any): boolean {
        return (
            formValue.feed_title ||
            formValue.feed_type ||
            formValue.description ||
            (formValue.assign_to !== '' && !this.isDealer)
        );
    }

    private filter(value: string): { dealerId: string; businessName: string }[] {
        const filter_value = value.toLowerCase();
        const filtered_result = this.dealers
            ? this.dealers.filter((i) => i.businessName.toLowerCase().includes(filter_value))
            : [];

        if (!this.is_dealer) {
            this.selected_dealer = filtered_result[0] && value ? filtered_result[0].dealerId : null;
            this.new_feed_form.controls.assign_to_id.setValue(this.selected_dealer);
        }

        return filtered_result;
    }

    private prepareFeedInfoForm(): void {
        const config = this.getFormConfig();
        this.new_feed_form = this._form.group(config);
        this.initializeAutocomplete();
    }

    private getFormConfig(): { [key: string]: any } {
        const baseConfig = {
            feed_title: ['', Validators.required],
            description: [''],
            feed_type: ['', Validators.required],
            assign_to: [this.dealerHasValue ? this.selectedDealer.businessName : '', Validators.required],
            assign_to_id: [this.dealerHasValue ? this.selectedDealer.dealerId : '', Validators.required],
        };

        if (this.editing) {
            return this.getEditingFormConfig(baseConfig);
        }

        return baseConfig;
    }

    private getEditingFormConfig(baseConfig: { [key: string]: any }): { [key: string]: any } {
        const feed = this.fetched_feed;
        return {
            ...baseConfig,
            feed_title: [feed ? feed.feedTitle : '', Validators.required],
            description: [feed ? feed.description : ''],
            feed_type: [
                { value: feed && feed.feedType ? feed.feedType.feedTypeId : '', disabled: true },
                Validators.required,
            ],
            assign_to: [{ value: null, disabled: true }],
            assign_to_id: [{ value: null, disabled: true }],
        };
    }

    private initializeAutocomplete(): void {
        this.filtered_options = this.new_feed_form.controls.assign_to.valueChanges.pipe(
            startWith(''),
            map((value) => this.filter(value)),
        );
    }

    public setAssignedTo(dealer: any): void {
        this.dealerHasValue = false;
        if (dealer) {
            this.editHasValue = true;
            this.selectedDealer = {
                businessName: dealer.value,
                dealerId: dealer.id,
            };
            this.new_feed_form.controls.assign_to.setValue(dealer.value);
            this.new_feed_form.controls.assign_to_id.setValue(dealer.id);
            this.dealerHasValue = true;
        } else {
            this.editHasValue = false;
            this.new_feed_form.controls.assign_to.setValue('');
            this.new_feed_form.controls.assign_to_id.setValue('');
        }
        this.new_feed_form.controls.assign_to.updateValueAndValidity();
        this.new_feed_form.controls.assign_to_id.updateValueAndValidity();
    }

    goBack() {
        this._location.back();
    }
}
