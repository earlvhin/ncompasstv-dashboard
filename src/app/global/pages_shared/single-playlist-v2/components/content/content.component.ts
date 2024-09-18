import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { API_CONTENT_V2 } from 'src/app/global/models';
import { IsimagePipe, IsFeedPipe, IsvideoPipe } from 'src/app/global/pipes';
import { environment } from 'src/environments/environment';
import { PlaylistContentControls } from '../../constants/PlaylistContentControls';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { HelperService } from 'src/app/global/services';

@Component({
    selector: 'app-content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
    providers: [IsimagePipe, IsFeedPipe, IsvideoPipe],
})
export class ContentComponent implements OnInit, OnDestroy {
    @Input() content: API_CONTENT_V2;
    @Input() index: number;
    @Input() controls = true;
    @Input() saving = false;
    @Input() selectable = true;
    @Input() selected = false;
    @Input() enabled_controls = [];
    @Input() default_width = true;
    @Input() detailed_view_mode = false;
    @Input() move_enabled: Subject<boolean> = new Subject<boolean>();
    @Input() swapping: boolean;
    @Input() is_frequency_enabled = true;
    @Output() control_click = new EventEmitter();
    @Output() content_selected = new EventEmitter();
    canSetFrequencyBorder = false;
    contentName: string;
    filestackScreenshot = `${environment.third_party.filestack_screenshot}`;
    isChildFrequency = false;
    isParentFrequency = false;
    playlistContentControls = PlaylistContentControls;
    playTimesText = '';
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _isImage: IsimagePipe,
        private _isVideo: IsvideoPipe,
        private _isFeed: IsFeedPipe,
        private _helper: HelperService,
        private _cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    ) {}

    ngOnInit() {
        if (this.content) {
            this.prepareThumbnails();
            this.subscribeToMoveButton();
            this.isParentFrequency =
                (this.is_frequency_enabled && this.content.frequency === 22) || this.content.frequency === 33;
            this.isChildFrequency =
                this.is_frequency_enabled && !this.isParentFrequency && this.content.frequency !== 0;
            this.subscribeToContentHover();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    private prepareThumbnails() {
        if (!this.content) return;

        /** webm assets  */
        if (this.content.fileType === 'webm') {
            this.content.thumbnail = `${this.content.url}${this.content.fileName.substring(0, this.content.fileName.lastIndexOf('.') + 1)}jpg`;
            this._cdr.detectChanges(); // Manually trigger change detection
        }

        /** mp4 assets */
        if (this.content.fileType === 'mp4' && this.content.handlerId) {
            this.content.thumbnail = `${this.content.url}${this.content.fileName.substring(0, this.content.fileName.lastIndexOf('.') + 1)}jpg`;
            this._cdr.detectChanges(); // Manually trigger change detection
        }

        /** image assets */
        if (this._isImage.transform(this.content.fileType)) {
            this.content.thumbnail = `${this.content.url}${this.content.fileName}`;
            this._cdr.detectChanges(); // Manually trigger change detection
        }
    }

    public convertDayFormat(days: any) {
        const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
        const convertedDays = [];

        for (const n of days) {
            if (n >= 0 && n <= 6) convertedDays.push(daysOfWeek[n]);
        }

        if (convertedDays[0] == 'S') convertedDays.push(convertedDays.shift());

        return convertedDays.join(', ');
    }

    public getFrequencyInfo() {
        if ((!this.isParentFrequency && !this.isChildFrequency) || !this.is_frequency_enabled) return;
        const frequency = this.content.frequency;
        const parsedFrequency = this.isParentFrequency ? (frequency === 22 ? 2 : 3) : frequency;
        let result = this.isParentFrequency ? 'Parent' : 'Child';
        result += ` frequency: ${parsedFrequency}x`;
        return result;
    }

    public getPlayTimesText() {
        const start = this.content.playTimeStart;
        const end = this.content.playTimeEnd;
        return start && end ? `${start} - ${end}` : '--';
    }

    public setHoveredBaseFrequency(content: API_CONTENT_V2) {
        const id = this.isParentFrequency ? content.playlistContentId : content.parentId;
        if (!id) return;
        this._helper.onHoverContent.next({ playlistContentId: id });
    }

    public isFillerChecker(content: API_CONTENT_V2): boolean {
        return content.classification === 'filler-v2';
    }

    public getIconClass(content: API_CONTENT_V2): string {
        if (this.isFillerChecker(content)) return 'fa-photo-video';
        if (this._isImage.transform(this.content.fileType)) return 'fa-image';
        if (this._isVideo.transform(this.content.fileType)) return 'fa-video';
        if (this._isFeed.transform(this.content.fileType)) return 'fa-rss';
        return '';
    }

    private subscribeToContentHover() {
        this._helper.onHoverContent.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
            let result = false;
            if (!response) return;
            const { playlistContentId } = response;
            result = this.isParentFrequency
                ? this.content.playlistContentId === playlistContentId
                : this.content.parentId === playlistContentId;
            this.canSetFrequencyBorder = result;
        });
    }

    private subscribeToMoveButton() {
        this.move_enabled.pipe(takeUntil(this._unsubscribe)).subscribe({
            next: (res) => {
                const moveButton = this.playlistContentControls.find((obj) => obj.action == 'quick-move');
                moveButton.disabled = res;
            },
        });
    }

    public unsetHoveredBaseFrequency() {
        this._helper.onHoverContent.next({ playlistContentId: undefined });
    }
}
