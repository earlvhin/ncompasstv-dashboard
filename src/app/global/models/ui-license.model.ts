import { TABLE_ROW_FORMAT } from './table-row-format.model';

export interface UI_LICENSE {
    alias?: TABLE_ROW_FORMAT;
    anydesk?: TABLE_ROW_FORMAT;
    dealerId?: TABLE_ROW_FORMAT;
    displayStatus?: TABLE_ROW_FORMAT;
    screenshotUrl?: TABLE_ROW_FORMAT;
    hostId?: TABLE_ROW_FORMAT;
    index?: TABLE_ROW_FORMAT;
    lastDisconnect?: TABLE_ROW_FORMAT; // timeOut
    lastPush?: TABLE_ROW_FORMAT; // contentsUpdated
    licenseKey?: TABLE_ROW_FORMAT;
    piStatus?: TABLE_ROW_FORMAT;
    pi_status?: TABLE_ROW_FORMAT;
    screenId?: TABLE_ROW_FORMAT;
    screenName?: TABLE_ROW_FORMAT;
    serverVersion?: TABLE_ROW_FORMAT;
    ui?: TABLE_ROW_FORMAT;
}
