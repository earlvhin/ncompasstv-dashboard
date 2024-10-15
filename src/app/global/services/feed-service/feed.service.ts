import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

import { API_FEED, UPSERT_WIDGET_FEED, PAGING, WEATHER_FEED_STYLE_DATA } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root',
})
export class FeedService extends BaseService {
    public logoutConfirmed = false;
    private unsavedChangesSubject = new BehaviorSubject<boolean>(false);
    hasUnsavedChanges$: Observable<boolean> = this.unsavedChangesSubject.asObservable();

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    setLogoutConfirmed(value: boolean) {
        this.logoutConfirmed = value;
    }

    setInputChanges(value: boolean) {
        this.unsavedChangesSubject.next(value);
    }

    /**
     * Checks via API if the feed url is accessible.
     * Returns true if the URL returns a response, otherwise false.
     * @param data
     * @returns boolean
     * @endpoint feed/validate/url
     */
    public canAccessUrl(data: string): Observable<boolean> {
        const body = { url: data };
        return this.postRequest(this.getters.validate_feed_url, body);
    }

    clone_feed(contentId: string, title: string, createdBy: string) {
        const url = `${this.creators.feed_clone}`;
        const body = { contentId, createdBy, title };
        return this.postRequest(url, body);
    }

    create_feed(data) {
        const url = `${this.creators.api_new_feed}`;
        return this.postRequest(url, data);
    }

    createWidgetFeed(body: UPSERT_WIDGET_FEED): Observable<{ feeds: API_FEED[]; message?: string }> {
        const endpoint = this.creators.api_new_feed;
        body.embeddedScript = encodeURIComponent(body.embeddedScript).replace(/'/g, '%27').replace(/"/g, '%22');
        return this.postRequest(endpoint, [body]);
    }

    updateWidgetFeed(body: UPSERT_WIDGET_FEED): Observable<{ message: string }> {
        const endpoint = this.updaters.api_update_feed;
        body.embeddedScript = encodeURIComponent(body.embeddedScript).replace(/'/g, '%27').replace(/"/g, '%22');
        return this.postRequest(endpoint, body);
    }

    edit_feed(data) {
        const url = `${this.updaters.api_update_feed}`;
        return this.postRequest(url, data);
    }

    edit_generated_feed(data) {
        const url = `${this.updaters.api_update_generated_feed}`;
        return this.postRequest(url, data);
    }

    generate_feed(data: any, type: string) {
        const url = `${this.creators.api_new_feed_generate}` + '/' + `${type}`;
        return this.postRequest(url, data);
    }

    get_feeds(
        page: number,
        key: string,
        column?: string,
        order?: string,
    ): Observable<{
        cFeeds: API_FEED[];
        paging: PAGING;
        message?: string;
    }> {
        const base = `${this.getters.api_get_feeds}`;
        const params = this.setUrlParams({ page, search: key, sortColumn: column, sortOrder: order }, false, true);
        const url = `${base}${params}`;
        return this.getRequest(url);
    }

    get_feeds_by_dealer(
        id: string,
        page: number,
        key: string,
    ): Observable<{
        cFeeds: API_FEED[];
        paging: PAGING;
        message?: string;
    }> {
        const base = `${this.getters.api_get_feeds_by_dealer}`;
        const params = this.setUrlParams({ dealerid: id, page, search: key }, false, true);
        const url = `${base}${params}`;
        return this.getRequest(url);
    }

    get_feed_types() {
        return this.getRequest(`${this.getters.api_get_feed_types}`).map((data: any) => data.feedTypes);
    }

    get_fillers() {
        return this.getRequest(`${this.getters.api_get_fillers}`).map((data: any) => data.fillers);
    }

    get_generated_feed_by_id(id: string) {
        return this.getRequest(`${this.getters.api_get_generated_feed_by_id}${id}`).pipe(map((data) => data.feed));
    }

    get_feeds_total() {
        return this.getRequest(`${this.getters.api_get_feeds_total}`);
    }

    get_feeds_total_by_dealer(id) {
        return this.getRequest(`${this.getters.api_get_feeds_total}` + '?dealerid=' + `${id}`);
    }

    getFeedById(feed_id) {
        return this.getRequest(`${this.getters.api_get_feed_by_id}${feed_id}`);
    }

    update_filler_feed(feed_data) {
        const url = `${this.updaters.api_update_filler_feed}`;
        return this.postRequest(url, feed_data);
    }

    update_slide_feed(feed_data) {
        const url = `${this.updaters.api_update_slide_feed}`;
        return this.postRequest(url, feed_data);
    }

    update_news_feed(feed_data) {
        const url = `${this.updaters.api_update_news_slide_feed}`;
        return this.postRequest(url, feed_data);
    }

    update_weather_feed(feed_data) {
        const url = `${this.updaters.api_update_weather_feed}`;
        return this.postRequest(url, feed_data);
    }

    create_weather_feed_demo(weather_feed_style: WEATHER_FEED_STYLE_DATA) {
        return this.getRequest(
            `${this.creators.api_new_weather_feed_demo}` +
                '?backgroundContentId=' +
                `${weather_feed_style.bannerContentId}` +
                '&bannerContentId=' +
                `${weather_feed_style.bannerContentId}daysFontColor`,
        );
    }

    validate_weather_zip(zip: string) {
        const url = `${this.getters.validate_weather_zip}${zip}`;
        return this.postRequest(url, {}).pipe(map((data: any) => data.weatherResponse));
    }

    validate_rss_url(url: string): Observable<boolean> {
        const endpoint = `${this.getters.validate_rss_url}`;
        const params = encodeURIComponent(url);
        const requestUrl = `${endpoint}${params}`;
        return this.postRequest(requestUrl, {});
    }

    validateColorFieldValues(control: FormControl): { [s: string]: boolean } {
        if (!control || !control.value) return;

        const controlValue = (control.value as string).toLowerCase();
        const hexPattern = new RegExp(/^#[0-9A-F]{6}$/i);

        if (controlValue.includes('rgba')) {
            const lastCharIndex = controlValue.length - 1;

            if (controlValue.substring(lastCharIndex) !== ')') return { invalidColor: true };

            const colorValuesEnclosed = controlValue.substring(5, lastCharIndex);
            const colorValues = colorValuesEnclosed.split(',');

            for (let i = 0; i < colorValues.length; i++) {
                if (i !== colorValues.length - 1 && colorValues[i].length > 3) return { invalidColor: true };
                if (i === colorValues.length - 1 && parseFloat(colorValues[i]) > 1) return { invalidColor: true };
            }

            return null;
        }

        if (hexPattern.test(controlValue)) return null;
        return { invalidColor: true };
    }

    /**
     * Checks if the feed url is well-formed
     * @param data
     * @returns boolean
     */
    public isUrlStructured(data: string): boolean {
        const PROTOCOLS = ['http://', 'https://'];

        const hasProtocol = () => PROTOCOLS.some((p) => data.startsWith(p));

        const hasValidPattern = () => {
            // Check for spaces in the URL
            if (data.includes(' ')) return false;

            const pattern = new RegExp(
                '^(https?://)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(:\\d+)?(/[-a-z\\d%_.~+]*)*' +
                    '(\\?(?:([^&=]+)=([^&=]*)&?|([^&=]+)=([^&=]*)\\[\\]&?|([^&=]+))*)?($|#[-a-z\\d_]*)?$',
                'i',
            );
            return pattern.test(data);
        };

        return hasValidPattern() && hasProtocol();
    }
}
