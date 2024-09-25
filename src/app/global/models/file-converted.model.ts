import { File } from 'filestack-js/build/main/lib/api/upload';

export interface FileConverted extends File {
    uuid: string;
}
