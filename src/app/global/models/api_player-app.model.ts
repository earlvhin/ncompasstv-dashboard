export interface API_PLAYER_APP {
    appDescription: string;
    appId: string;
    appName: string;
    currentVersion: string;
    dateCreated: string;
    dateUpdated?: string;
    githubUrl: string;
}

export interface API_APP_FORM {
    appDescription: string;
    appName: string;
    githubUrl: string;
}

export interface API_VERSION_FORM {
    version: string;
    releaseNotes: string;
    zipUrl: string;
    appId: string;
}
