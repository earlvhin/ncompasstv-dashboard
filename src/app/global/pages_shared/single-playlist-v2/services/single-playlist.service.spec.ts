import { TestBed } from '@angular/core/testing';

import { SinglePlaylistService } from './single-playlist.service';

describe('SinglePlaylistService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: SinglePlaylistService = TestBed.get(SinglePlaylistService);
        expect(service).toBeTruthy();
    });
});
