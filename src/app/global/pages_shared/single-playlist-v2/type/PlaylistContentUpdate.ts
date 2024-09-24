import { PlaylistContentSchedule } from 'src/app/global/models';

export type PlaylistContentUpdate = {
    playlistId: string;
    playlistContentsLicenses: PlaylistContent[];
};

export type PlaylistContent = {
    contentId?: string;
    duration?: number;
    frequency?: number;
    isFullScreen?: number;
    licenseIds?: string[];
    playlistContentId?: string;
    seq?: number;
    schedule?: PlaylistContentSchedule;
};

export type BlacklistUpdates = {
    playlistContentId: string;
    licenses: string[];
};
