import { ButtonGroup } from '../type/ButtonGroup';

export const CONTENT_SCHEDULE: ButtonGroup[] = [
    {
        value: 1,
        label: 'Default Play',
        slug: 'default-play',
        icon: 'fas fa-clock',
        show: true,
    },
    {
        value: 3,
        label: 'Custom Schedule',
        slug: 'custom-schedule',
        icon: 'fas fa-calendar',
        show: true,
    },
    {
        value: 2,
        label: 'Do Not Play',
        slug: 'do-not-play',
        icon: 'fas fa-ban',
        show: true,
    },
];

export enum CONTENT_SCHEDULE_FORM_ERRORS {
    no_days_selected = 'no_days_selected',
    invalid_dates = 'invalid_dates',
    invalid_play_times = 'invalid_play_times',
}
