export const PlaylistContentControls = [
    {
        label: 'Fullscreen',
        icon: 'fas fa-expand-arrows-alt',
        colorClass: 'text-black',
        action: 'fullscreen',
    },
    {
        label: 'Quick Move',
        icon: 'fas fa-retweet-alt',
        colorClass: 'text-info',
        disabled: false,
        action: 'quick-move',
    },
    {
        label: 'Swap Content',
        icon: 'fas fa-exchange-alt',
        colorClass: 'text-orange',
        action: 'swap-content',
    },
    {
        label: 'Edit',
        icon: 'fas fa-cog',
        colorClass: 'text-primary',
        action: 'edit',
    },
    {
        label: 'Remove',
        icon: 'fas fa-times',
        colorClass: 'text-danger',
        action: 'remove',
    },
    {
        label: 'Not Allowed',
        icon: 'fas fa-ban',
        colorClass: 'text-gray',
        action: 'ban',
    },
];

export const PlaylistContentControlActions = {
    remove: 'remove',
    edit: 'edit',
    fullscreen: 'fullscreen',
    quickMove: 'quick-move',
    swapContent: 'swap-content',
};
