export interface API_CHANGE_TEMPLATE {
    old: { screen: { screenId: string } };
    new: {
        screen: { templateId: string };
        screenZonePlaylists: { templateZoneId: string; playlistId: string }[];
    };
}
