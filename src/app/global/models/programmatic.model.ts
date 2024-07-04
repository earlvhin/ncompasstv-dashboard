export interface PROGRAMMATIC_CREATE {
    name: string;
    description: string;
    apiUrl: string;
    programmaticKeyValues?: ProgrammaticKeyValues[];
}

class ProgrammaticKeyValues {
    key: string;
    value: string;
}
