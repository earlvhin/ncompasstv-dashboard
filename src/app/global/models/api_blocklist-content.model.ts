export class API_BLOCKLIST_CONTENT {
    licenseId: string;
    contentId: string;
    playlistContentId: string;

    constructor(license: string, content: string, playlistContentId: string) {
        this.licenseId = license;
        this.contentId = content;
        this.playlistContentId = playlistContentId;
    }
}
