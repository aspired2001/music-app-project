import {
    Controller,
    Get,
    Post,
    Put,
    Query,
    Body,
    HttpException,
    HttpStatus,
    UseInterceptors,
    ClassSerializerInterceptor,
    Param
} from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
@UseInterceptors(ClassSerializerInterceptor)
export class SpotifyController {
    constructor(private readonly spotifyService: SpotifyService) { }

    @Get('search')
    async searchSpotify(
        @Query('q') query: string,
        @Query('types') types: string = 'track,artist',
        @Query('limit') limit: string = '20',
        @Query('offset') offset: string = '0',
        @Query('market') market: string = 'US'
    ) {
        // Validate query parameter
        if (!query || query.trim() === '') {
            throw new HttpException('Search query is required and cannot be empty', HttpStatus.BAD_REQUEST);
        }

        try {
            // Ensure types is an array and convert limit/offset to numbers
            const typeArray = types.split(',').map(type => type.trim());
            const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10)));
            const parsedOffset = Math.max(0, parseInt(offset, 10));

            // Perform Spotify search
            const searchResults = await this.spotifyService.searchSpotify(
                query,
                typeArray,
                parsedLimit,
                parsedOffset,
                market
            );

            // Transform results
            const transformedResults = this.spotifyService.transformSearchResults(searchResults);

            return {
                success: true,
                results: transformedResults,
                total: {
                    tracks: searchResults.tracks?.total || 0,
                    albums: searchResults.albums?.total || 0,
                    artists: searchResults.artists?.total || 0
                }
            };
        } catch (error) {
            console.error('Spotify Search Error:', error);
            throw new HttpException(
                error.message || 'Failed to search Spotify',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
   
    @Get('player')
    async getCurrentPlaybackState(
        @Query('market') market: string = 'US',
        @Query('additional_types') additionalTypes: string = 'track,episode'
    ) {
        try {
            const typeArray = additionalTypes.split(',').map(type => type.trim());

            const playbackState = await this.spotifyService.getCurrentPlaybackState(
                market,
                typeArray
            );

            return {
                success: true,
                playbackState
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to retrieve playback state',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Start/Resume Playback
    @Put('player/play')
    async startPlayback(
        @Query('device_id') deviceId?: string,
        @Body() body?: {
            context_uri?: string,
            uris?: string[],
            offset?: { position?: number, uri?: string },
            position_ms?: number
        }
    ) {
        try {
            const result = await this.spotifyService.startPlayback(
                deviceId,
                body?.context_uri,
                body?.uris,
                body?.offset,
                body?.position_ms
            );

            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to start playback',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Pause Playback
    @Put('player/pause')
    async pausePlayback(
        @Query('device_id') deviceId?: string
    ) {
        try {
            const result = await this.spotifyService.pausePlayback(deviceId);
            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to pause playback',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Skip to Next Track
    @Post('player/next')
    async skipToNextTrack(
        @Query('device_id') deviceId?: string
    ) {
        try {
            const result = await this.spotifyService.skipToNextTrack(deviceId);
            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to skip to next track',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Skip to Previous Track
    @Post('player/previous')
    async skipToPreviousTrack(
        @Query('device_id') deviceId?: string
    ) {
        try {
            const result = await this.spotifyService.skipToPreviousTrack(deviceId);
            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to skip to previous track',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('track/:id')
    async getTrackById(
        @Param('id') trackId: string,
        @Query('market') market: string = 'US'
    ) {
        try {
            // Validate track ID
            if (!trackId) {
                throw new HttpException('Track ID is required', HttpStatus.BAD_REQUEST);
            }

            // Fetch track details
            const trackDetails = await this.spotifyService.getTrackById(
                trackId,
                market
            );

            return {
                success: true,
                track: trackDetails
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to retrieve track details',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
