export class AddPlaylistContent {
    playlistId: string;
    playlistContentsLicenses: PlaylistContentsLicenses[];
}

export interface PlaylistContentsLicenses {
    classification: string;
    contentId: string;
    fileType: string;
    fillerPlaylistId?: string;
    seq: number;
    isFullScreen: number;
    duration: number;
    licenseIds: string[];
    alternateWeek?: number;
    from?: string;
    to?: string;
    day?: string;
    playTimeStart?: string;
    playTimeEnd?: string;
    type?: number;
    playlistContentShceduleId?: string;
}
