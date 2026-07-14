export declare class UploadsController {
    uploadImage(file: Express.Multer.File): {
        url: string;
    };
    uploadVideo(file: Express.Multer.File): Promise<unknown>;
}
