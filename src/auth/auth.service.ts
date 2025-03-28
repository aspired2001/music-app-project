import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthService {
    private clientId = process.env.SPOTIFY_CLIENT_ID;
    private clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    private tokenUrl = "https://accounts.spotify.com/api/token";

    private accessToken: string | null = null;
    private tokenExpiresAt: number | null = null;

    async getAccessToken(): Promise<string> {
        // Check if we have a valid token
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        // Request a new access token
        const response = await axios.post(
            this.tokenUrl,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret,
            } as Record<string, string>),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
        );

        // Store the new token and its expiration
        this.accessToken = response.data.access_token;
        this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

        return this.accessToken!;
    }

    // Existing method for Spotify authorization code flow
    async getSpotifyToken(code: string): Promise<any> {
        const response = await axios.post(
            this.tokenUrl,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: this.clientId,
                client_secret: this.clientSecret,
            } as Record<string, string>),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
        );
        return response.data;
    }
}