export enum ACTIVITY_CODES {
    content_update = 'content_update',
    refetch = 'refetch',
    update_system = 'update_system',
    reboot_pi = 'reboot_pi',
    reboot_player = 'reboot_player',
    reset_data = 'reset_data',
    screenshot = 'screenshot',
    restart_anydesk = 'restart_anydesk',
    speedtest = 'speedtest',
    monitor_toggled_off = 'monitor_toggled_off',
    monitor_toggled_on = 'monitor_toggled_on',
    terminal_run = 'terminal_run',
}

export const ACTIVITY_URLS = [
    {
        activityCodePrefix: 'playlist',
        activityURL: 'playlists',
    },
    {
        activityCodePrefix: 'screen',
        activityURL: 'screens',
    },
    {
        activityCodePrefix: 'dealer',
        activityURL: 'dealers',
    },
    {
        activityCodePrefix: 'host',
        activityURL: 'hosts',
    },
    {
        activityCodePrefix: 'filler',
        activityURL: 'fillers/view-fillers-group',
    },
    {
        activityCodePrefix: 'media',
        activityURL: 'media-library',
    },
];
