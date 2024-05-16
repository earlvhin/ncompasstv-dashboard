export class TABLE_VERSION {
    label: any[];
    data: any[];
    hasActions: any;

    constructor(options: { label: any[]; data: any[]; hasActions: boolean }) {
        this.label = options.label;
        this.data = options.data;
        this.hasActions = options.hasActions;
    }
}
export interface TABLE_DATA {
    value?: string;
    url?: string;
    isHidden?: boolean;
    uniqueIdentifier?: string;
    downloadUrl?: string;
    route?: string;
}

export interface TABLE_ACTIONS {
    label: string;
    icon: string;
    action: string;
    title: string;
}

export interface App {
    appDescription: string;
    appId: string;
    appName: string;
    currentVersion: string;
    dateCreated: string;
    dateUpdated: string;
    githubUrl: string;
}

export class APP_VERSIONS {
    appId?: any;
    dateCreated?: any;
    dateUpdated?: null;
    releaseNotes?: any;
    version?: any;
    versionId?: any;
    zipUrl?: any;

    constructor(
        appId: any,
        dateCreated: any,
        dateUpdated: any,
        releaseNotes: any,
        version: any,
        versionId: any,
        zipUrl: any,
    ) {
        this.appId = appId;
        this.dateCreated = dateCreated;
        this.dateUpdated = dateUpdated;
        this.releaseNotes = releaseNotes;
        this.version = version;
        this.versionId = versionId;
        this.zipUrl = zipUrl;
    }
}
