import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CITIES_STATE, CityData } from 'src/app/global/models/api_cities_state.model';
import { LocationService } from 'src/app/global/services';
import { MAPPED_CITY, UI_CITY_AUTOCOMPLETE, UI_CITY_AUTOCOMPLETE_DATA } from 'src/app/global/models';

@Component({
    selector: 'app-city-autocomplete',
    templateUrl: './city-autocomplete.component.html',
    styleUrls: ['./city-autocomplete.component.scss'],
})
export class CityAutocompleteComponent implements OnInit, OnChanges {
    cityDataPrimary: CityData[] = [];
    cityFieldData: UI_CITY_AUTOCOMPLETE = {
        label: 'City',
        placeholder: 'Type a city or state',
        data: [],
        initialValue: [],
        allowSearchTrigger: false,
        unselect: true,
    };
    cityFromGoogleScrape: any;
    citiesStateData: CITIES_STATE;
    finalCityList: any[] = [];

    @Input() selected_city_from_google: string;
    @Output() city_autocomplete_ready: EventEmitter<any> = new EventEmitter();
    @Output() city_selected: EventEmitter<any> = new EventEmitter();

    protected _unsubscribe = new Subject<void>();

    constructor(private _location: LocationService) {}

    ngOnInit() {
        this.getCitiesAndStates();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.onCityAutocompleteChanges(changes);
    }

    private getCitiesAndStates(page?: number) {
        this._location
            .get_cities_data(page)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: CITIES_STATE) => {
                this.citiesStateData = response;

                for (let index = 0; index < this.citiesStateData.data.length; index++) {
                    if (index >= 60) {
                        break;
                    }

                    const cityData = this.citiesStateData.data[index];
                    this.cityDataPrimary.push(cityData);
                }

                this.cityFieldData.data = this.mapCityData(this.cityDataPrimary);
            })
            .add(() => {
                this.finalCityList = this.cityFieldData.data;
                this.city_autocomplete_ready.emit(true);
            });
    }

    filterCities(keywordData: string | MAPPED_CITY) {
        /** Keyword no value */
        if (!keywordData) {
            this.cityFieldData.data = this.mapCityData(this.cityDataPrimary);
            this.cityFieldData.unselect = true;
            this.cityFieldData.noData = null;
            return;
        }

        if (typeof keywordData === 'string' && keywordData.length) {
            const filteredCities = this.citiesStateData.data.filter((cityData: CityData) => {
                /** Convert keywordData and city/state names to lower case for case-insensitive comparison */
                const keywordLower = keywordData.toLowerCase();
                const cityLower = cityData.city.toLowerCase();
                const stateLower = cityData.state.toLowerCase();

                /**
                 * Check if the keyword matches the first three characters of city or state
                 * and either the keyword is exactly three characters long or what follows the
                 * first three characters is just whitespace or there are no more characters
                 */
                return (
                    (keywordLower.startsWith(cityLower.slice(0, 1)) &&
                        (keywordLower.length === 1 || cityLower.startsWith(keywordLower))) ||
                    (keywordLower.startsWith(stateLower.slice(0, 1)) &&
                        (keywordLower.length === 1 || stateLower.startsWith(keywordLower)))
                );
            });

            /** Keyword not found within the filtered data */
            if (!filteredCities.length) {
                this.cityFieldData.data = this.mapCityData(this.cityDataPrimary);
                this.cityFieldData.noData = `${keywordData} not found`;
                this.cityFieldData.unselect = false;
                this.city_selected.emit(null);
                return;
            } else {
                this.cityFieldData.unselect = true;
            }

            /** Data found */
            this.cityFieldData.data = this.mapCityData(filteredCities);
            this.cityFieldData.noData = null;
        }
    }

    mapCityData(cityData: CityData[]): MAPPED_CITY[] {
        return cityData.map((c) => {
            const mapped: MAPPED_CITY = {
                id: c.id,
                value: `${c.city}, ${c.state}`,
                city: c.city,
                display: c.city,
                country: c.country,
                state: c.abbreviation,
                region: c.region,
            };

            return mapped;
        });
    }

    onCityAutocompleteChanges(changes: SimpleChanges) {
        if (changes.selected_city_from_google.currentValue && this.citiesStateData.data.length) {
            this.selected_city_from_google = this.selected_city_from_google;
            this.cityFromGoogleScrape = this.citiesStateData.data.find(
                (cityData) => cityData.city.toLowerCase() === this.selected_city_from_google.toLowerCase(),
            );
        }
    }

    selectedCity(data: UI_CITY_AUTOCOMPLETE_DATA) {
        data ? this.city_selected.emit(data) : this.city_selected.emit(null);
    }
}
