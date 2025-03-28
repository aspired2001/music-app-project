import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SpotifyService {
    private readonly baseUrl = 'https://api.spotify.com/v1';

    constructor(private readonly authService: AuthService) { }

    async searchSpotify(
        query: string,
        types: string[] = ['track', 'album', 'artist'],
        limit: number = 20,
        offset: number = 0,
        market: string = 'US'
    ) {
        try {
            // Validate inputs
            if (!query) throw new Error('Search query is required');

            // Validate types
            const validTypes = ['track', 'album', 'artist', 'playlist'];
            const filteredTypes = types.filter(type => validTypes.includes(type.toLowerCase()));

            if (filteredTypes.length === 0) {
                throw new Error('Invalid search types');
            }

            // Get access token from AuthService
            const accessToken = await this.authService.getAccessToken();

            // Construct search parameters
            const params = new URLSearchParams({
                q: query,
                type: filteredTypes.join(','),
                limit: limit.toString(),
                offset: offset.toString(),
                market
            });

            // Make request to Spotify Search API
            const response = await axios.get(`${this.baseUrl}/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            // Detailed error logging
            console.error('Spotify Search Error Details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            // Throw a more informative error
            if (error.response) {
                // Spotify API specific error
                throw new Error(`Spotify API Error: ${error.response.data.error.message || 'Unknown error'}`);
            } else if (error.request) {
                // Network or request setup error
                throw new Error('No response received from Spotify. Check your network connection.');
            } else {
                // Generic error
                throw new Error(`Search failed: ${error.message}`);
            }
        }
    }

    // Helper method to transform Spotify search results
    transformSearchResults(searchResults: any) {
        const transformedResults = {
            tracks: searchResults.tracks?.items.map(this.transformTrack) || [],
            albums: searchResults.albums?.items.map(this.transformAlbum) || [],
            artists: searchResults.artists?.items.map(this.transformArtist) || []
        };

        return transformedResults;
    }

    private transformTrack(track: any) {
        return {
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name,
            album: track.album?.name,
            duration: track.duration_ms,
            previewUrl: track.preview_url,
            spotifyUrl: track.external_urls?.spotify
        };
    }

    private transformAlbum(album: any) {
        return {
            id: album.id,
            name: album.name,
            artist: album.artists[0]?.name,
            releaseDate: album.release_date,
            totalTracks: album.total_tracks,
            coverImage: album.images[0]?.url,
            spotifyUrl: album.external_urls?.spotify
        };
    }

    private transformArtist(artist: any) {
        return {
            id: artist.id,
            name: artist.name,
            genres: artist.genres,
            followers: artist.followers?.total,
            spotifyUrl: artist.external_urls?.spotify
        };
    }


    // Get Current Playback State
    async getCurrentPlaybackState(market: string = 'US', additionalTypes: string[] = ['track', 'episode']) {
        try {
            const accessToken = await this.authService.getAccessToken();

            const params = new URLSearchParams({
                market,
                additional_types: additionalTypes.join(',')
            });

            const response = await axios.get(`${this.baseUrl}/me/player?${params}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return this.transformPlaybackState(response.data);
        } catch (error) {
            this.handleSpotifyError(error, 'Get Playback State');
        }
    }

    // Start/Resume Playback
    async startPlayback(
        deviceId?: string,
        contextUri?: string,
        uris?: string[],
        offset?: { position?: number, uri?: string },
        positionMs: number = 0
    ) {
        try {
            const accessToken = await this.authService.getAccessToken();

            const params = new URLSearchParams();
            if (deviceId) params.append('device_id', deviceId);

            const payload: any = {};
            if (contextUri) payload.context_uri = contextUri;
            if (uris) payload.uris = uris;
            if (offset) payload.offset = offset;
            payload.position_ms = positionMs;

            await axios.put(`${this.baseUrl}/me/player/play?${params}`, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, message: 'Playback started' };
        } catch (error) {
            this.handleSpotifyError(error, 'Start Playback');
        }
    }

    // Pause Playback
    async pausePlayback(deviceId?: string) {
        try {
            const accessToken = await this.authService.getAccessToken();

            const params = new URLSearchParams();
            if (deviceId) params.append('device_id', deviceId);

            await axios.put(`${this.baseUrl}/me/player/pause?${params}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, message: 'Playback paused' };
        } catch (error) {
            this.handleSpotifyError(error, 'Pause Playback');
        }
    }

    // Skip to Next Track
    async skipToNextTrack(deviceId?: string) {
        try {
            const accessToken = await this.authService.getAccessToken();

            const params = new URLSearchParams();
            if (deviceId) params.append('device_id', deviceId);

            await axios.post(`${this.baseUrl}/me/player/next?${params}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, message: 'Skipped to next track' };
        } catch (error) {
            this.handleSpotifyError(error, 'Skip Next');
        }
    }

    // Skip to Previous Track
    async skipToPreviousTrack(deviceId?: string) {
        try {
            const accessToken = await this.authService.getAccessToken();

            const params = new URLSearchParams();
            if (deviceId) params.append('device_id', deviceId);

            await axios.post(`${this.baseUrl}/me/player/previous?${params}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, message: 'Skipped to previous track' };
        } catch (error) {
            this.handleSpotifyError(error, 'Skip Previous');
        }
    }

    // Transform Playback State
    private transformPlaybackState(playbackState: any) {
        if (!playbackState) return null;

        return {
            device: playbackState.device ? {
                id: playbackState.device.id,
                name: playbackState.device.name,
                type: playbackState.device.type,
                isActive: playbackState.device.is_active,
                volumePercent: playbackState.device.volume_percent
            } : null,
            repeatState: playbackState.repeat_state,
            shuffleState: playbackState.shuffle_state,
            context: playbackState.context ? {
                type: playbackState.context.type,
                uri: playbackState.context.uri
            } : null,
            progressMs: playbackState.progress_ms,
            isPlaying: playbackState.is_playing,
            currentTrack: playbackState.item ? this.transformTrack(playbackState.item) : null,
            currentlyPlayingType: playbackState.currently_playing_type
        };
    }

    // Error Handling Method
    private handleSpotifyError(error: any, context: string) {
        console.error(`Spotify ${context} Error Details:`, {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        if (error.response) {
            // Spotify API specific error
            throw new Error(`Spotify API Error (${context}): ${error.response.data.error.message || 'Unknown error'}`);
        } else if (error.request) {
            // Network or request setup error
            throw new Error(`No response received from Spotify (${context}). Check your network connection.`);
        } else {
            // Generic error
            throw new Error(`${context} failed: ${error.message}`);
        }
    }

    async getTrackById(
        trackId: string,
        market: string = 'US'
    ) {
        try {
            // Validate input
            if (!trackId) {
                throw new Error('Track ID is required');
            }

            // Get access token from AuthService
            const accessToken = await this.authService.getAccessToken();

            // Construct query parameters
            const params = new URLSearchParams({
                market
            });

            // Make request to Spotify Track API
            const response = await axios.get(`${this.baseUrl}/tracks/${trackId}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Transform and return track details
            return this.transformTrackDetails(response.data);
        } catch (error) {
            // Error handling
            this.handleSpotifyError(error, 'Get Track Details');
        }
    }

    // Enhanced track transformation for detailed track info
    private transformTrackDetails(track: any) {
        return {
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
                spotifyUrl: artist.external_urls?.spotify
            })),
            album: {
                id: track.album.id,
                name: track.album.name,
                releaseDate: track.album.release_date,
                releaseDatePrecision: track.album.release_date_precision,
                totalTracks: track.album.total_tracks,
                coverImage: track.album.images[0]?.url,
                albumType: track.album.album_type,
                spotifyUrl: track.album.external_urls?.spotify
            },
            duration: track.duration_ms,
            trackNumber: track.track_number,
            discNumber: track.disc_number,
            isExplicit: track.explicit,
            popularity: track.popularity,
            previewUrl: track.preview_url,
            availableMarkets: track.available_markets,
            externalIds: {
                isrc: track.external_ids?.isrc,
                ean: track.external_ids?.ean,
                upc: track.external_ids?.upc
            },
            spotifyUrl: track.external_urls?.spotify,
            isPlayable: track.is_playable,
            restrictions: track.restrictions ? {
                reason: track.restrictions.reason
            } : null
        };
    }
}