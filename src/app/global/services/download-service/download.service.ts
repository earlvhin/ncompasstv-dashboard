import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class DownloadService {
    constructor() {}

    public downloadFile(url: string, fileName: string) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
    }
}
