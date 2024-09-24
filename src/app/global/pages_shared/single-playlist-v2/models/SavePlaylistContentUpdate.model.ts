import { BlacklistUpdates, PlaylistContent } from '../type/PlaylistContentUpdate';

export interface SavePlaylistContentUpdate {
    contentUpdates: PlaylistContent[];
    blacklistUpdates?: BlacklistUpdates[];
    hasSchedulerFormChanges: boolean;
    hasPlayLocationChanges: boolean;
    isBulkUpdate: boolean;
}
