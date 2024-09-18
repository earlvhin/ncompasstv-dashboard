export const PlaylistPrimaryControlActions = {
    addContent: 'add-content',
    bulkDelete: 'bulk-delete',
    bulkModify: 'bulk-modify',
    markAll: 'mark-all',
    playlistDemo: 'playlist-demo',
    savePlaylist: 'save-playlist',
    newSpacer: 'news-spacer',
};

export const PlaylistViewOptionActions = {
    detailedView: 'detailed-view',
    gridView: 'grid-view',
};

export const PlaylistFilterActions = {
    contentType: 'content_type',
    contentStatus: 'content_status',
};

export const PlaylistPrimaryControls = [
    {
        label: 'Mark All',
        action: PlaylistPrimaryControlActions.markAll,
        icon: 'fas fa-check text-green',
        disabled: true,
    },
    {
        label: 'Add Content',
        action: PlaylistPrimaryControlActions.addContent,
        icon: 'fas fa-spinner fa-spin text-green',
        disabled: true,
    },
    // {
    //     label: 'New Spacer',
    //     action: PlaylistPrimaryControlActions.newSpacer,
    //     icon: 'fas fa-plus text-green',
    // },
    {
        label: 'Bulk Modify',
        action: PlaylistPrimaryControlActions.bulkModify,
        icon: 'fas fa-cog text-green',
        disabled: true,
    },
    {
        label: 'Bulk Delete',
        action: PlaylistPrimaryControlActions.bulkDelete,
        icon: 'fas fa-times text-danger',
        disabled: true,
    },
    {
        label: 'Save Changes',
        action: PlaylistPrimaryControlActions.savePlaylist,
        icon: 'fas fa-save',
        className: 'bg-primary',
        disabled: true,
    },
];

export const PlaylistFilterLabels = {
    contentTypeLabel: 'Content Type',
    contentStatusLabel: 'Content Schedule Status',
};

export const PlaylistFiltersDropdown = [
    {
        label: PlaylistFilterLabels.contentTypeLabel,
        icon: 'fas fa-image',
        action: PlaylistFilterActions.contentType,
        items: [
            { label: 'All', action: 'all' },
            { label: 'Feed', action: 'feed' },
            { label: 'Image', action: 'image' },
            { label: 'Video', action: 'video' },
            { label: 'Fillers', action: 'filler' },
        ],
    },
    {
        label: PlaylistFilterLabels.contentStatusLabel,
        action: PlaylistFilterActions.contentStatus,
        icon: 'fas fa-calendar-alt',
        items: [
            { label: 'All', action: 'all' },
            { label: 'Active', action: 'active' },
            { label: 'In Queue', action: 'in-queue' },
            { label: 'Inactive', action: 'inactive' },
            // ,{ label: 'Scheduled', action: 'scheduled' }
        ],
    },
];

export const PlaylistViewOptions = [
    {
        label: 'Grid View',
        action: PlaylistViewOptionActions.gridView,
        icon: 'fas fa-th',
        is_selected: false,
    },
    {
        label: 'Detailed View',
        action: PlaylistViewOptionActions.detailedView,
        icon: 'fas fa-info',
        is_selected: false,
    },
    {
        label: 'View Demo',
        action: PlaylistPrimaryControlActions.playlistDemo,
        icon: 'fas fa-play',
    },
];
