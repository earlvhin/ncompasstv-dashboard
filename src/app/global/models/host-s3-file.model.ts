export interface HOST_S3_FILE {
    hostId: string;
    type: string | number;
    createdBy: string;
    files: { oldFile: string; newFile: string }[];
}
