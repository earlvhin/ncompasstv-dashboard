import { EventEmitter, HostListener, Output } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { API_FEED_TYPES, API_GENERATED_FEED, GenerateSlideFeed } from 'src/app/global/models';
import { AuthService, FeedService } from 'src/app/global/services';

/**
 * Component for managing feed information.
 */
@Component({
    selector: 'app-feed-info',
    templateUrl: './feed-info.component.html',
    styleUrls: ['./feed-info.component.scss'],
})
export class FeedInfoComponent implements OnInit {
    @Input() dealers: { dealerId: string; businessName: string }[];
    @Input() editing: boolean = false;
    @Input() fetched_feed: API_GENERATED_FEED;
    @Input() feed_types: API_FEED_TYPES[];
    @Input() is_dealer: boolean = false;
    @Output() feed_info = new EventEmitter();
    @Output() formChanges: EventEmitter<boolean> = new EventEmitter<boolean>();

    existing: any;
    filtered_options: Observable<{ dealerId: string; businessName: string }[]>;
    generated_feed: GenerateSlideFeed;
    hasUnsavedChanges: boolean = false;
    isDealer = this._auth.current_role === 'dealer' || this._auth.current_role === 'sub-dealer';
    isDisabled: boolean = false;
    new_feed_form: FormGroup;
    selected_dealer: string;
    private formSubscription: Subscription;
    currentUser: any;
    isEditingOrDealer: boolean = false;

    // New properties for dealer-autocomplete
    hasLoadedDealers = false;
    isCurrentUserDealer = false;
    selectedDealer: any[] = [];

    /**
     * Creates an instance of FeedInfoComponent.
     * @param {AuthService} _auth - The authentication service.
     * @param {FormBuilder} _form - The form builder service.
     * @param {FeedService} _feed - The feed service.
     */
    constructor(
        private _auth: AuthService,
        private _form: FormBuilder,
        private _feed: FeedService,
    ) {
        this.currentUser = this._auth.current_user_value;
        this.isCurrentUserDealer = this._auth.current_role === 'dealer' || this._auth.current_role === 'sub-dealer';
        this.isEditingOrDealer = this.editing || this.isCurrentUserDealer;
    }

    /**
     * Initializes the component.
     */
    ngOnInit() {
        this.loadDealers();
        this.prepareFeedInfoForm();

        this.formSubscription = this.new_feed_form.valueChanges.subscribe((f) => {
            this.hasUnsavedChanges =
                f.feed_title || f.feed_type || f.description || (f.assign_to !== '' && !this.isDealer);
            this.formChanges.emit(this.hasUnsavedChanges);
            this.updateHasUnsavedChanges(this.hasUnsavedChanges);
        });
    }

    /**
     * Cleans up the component.
     */
    ngOnDestroy() {
        window.removeEventListener('beforeunload', this.unloadNotification);
        this.formSubscription.unsubscribe();
    }

    /**
     * Handles the beforeunload event.
     * @param {any} $event - The beforeunload event.
     */
    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any): void {
        if (this.hasUnsavedChanges) {
            $event.returnValue = true;
        }
    }

    /**
     * Updates the unsaved changes status.
     * @param {boolean} value - The new unsaved changes status.
     */
    updateHasUnsavedChanges(value: boolean) {
        this._feed.setInputChanges(value);
    }

    /**
     * Handles dealer selection.
     * @param {Object} data - The selected dealer data.
     * @param {string} data.id - The dealer ID.
     * @param {string} data.value - The dealer business name.
     */
    dealerSelected(data: { id: string; value: string }) {
        if (data) {
            this.new_feed_form.patchValue({
                assign_to: data.value,
                assign_to_id: data.id,
            });
            this.selectedDealer = [data];
        } else {
            this.new_feed_form.patchValue({
                assign_to: null,
                assign_to_id: null,
            });
            this.selectedDealer = [];
        }
        this.hasUnsavedChanges = true;
        this.formChanges.emit(this.hasUnsavedChanges);
    }

    /**
     * Loads dealer information.
     * @private
     */
    private loadDealers() {
        this.hasLoadedDealers = true;

        if (this.editing) {
            if (this.fetched_feed.dealerId) {
                this.selectedDealer = [
                    {
                        id: this.fetched_feed.dealerId,
                        value: this.fetched_feed.dealer.businessName,
                    },
                ];
            }
        } else if (this.isCurrentUserDealer) {
            this.selectedDealer = [
                {
                    id: this.currentUser.roleInfo.dealerId,
                    value: this.currentUser.roleInfo.businessName,
                },
            ];
        }
    }

    /**
     * Prepares the feed information form.
     * @private
     */
    private prepareFeedInfoForm(): void {
        let config: { [key: string]: any };
        const feed = this.fetched_feed;

        config = {
            feed_title: ['', Validators.required],
            description: [''],
            feed_type: ['', Validators.required],
            assign_to: [''],
            assign_to_id: [''],
        };

        if (this.editing) {
            config['feed_title'] = [feed.feedTitle, Validators.required];
            config['description'] = [feed.description];
            config['feed_type'] = [{ value: feed.feedType.feedTypeId, disabled: true }, Validators.required];
            config['assign_to'] = [{ value: feed.dealer ? feed.dealer.businessName : '', disabled: true }];
            config['assign_to_id'] = [{ value: feed.dealerId, disabled: true }];
        } else if (this.isCurrentUserDealer) {
            config['assign_to'] = [{ value: this.currentUser.roleInfo.businessName, disabled: true }];
            config['assign_to_id'] = [{ value: this.currentUser.roleInfo.dealerId, disabled: true }];
        }

        this.new_feed_form = this._form.group(config);
    }

    /**
     * Structures and emits the feed information.
     */
    structureFeedInfo() {
        const formValue = this.new_feed_form.value;
        const feedInfo = {
            feed_title: formValue.feed_title,
            description: formValue.description,
            feed_type: formValue.feed_type,
            assign_to_id: this.isCurrentUserDealer ? this.currentUser.roleInfo.dealerId : formValue.assign_to_id,
        };

        this.feed_info.emit(feedInfo);
    }
}
