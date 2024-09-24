export const PLAYLIST_SETTING_ACTIONS = {
    edit: 'edit',
    clone: 'clone',
    pushUpdates: 'push-updates',
};

export const PLAYLIST_SETTING_BUTTONS = [
    {
        label: 'Edit',
        action: PLAYLIST_SETTING_ACTIONS.edit,
        icon: 'fas fa-edit',
    },
    {
        label: 'Clone',
        action: PLAYLIST_SETTING_ACTIONS.clone,
        icon: 'fas fa-copy',
    },
    {
        label: 'Push Updates',
        action: PLAYLIST_SETTING_ACTIONS.pushUpdates,
        icon: 'fas fa-upload',
    },
];
