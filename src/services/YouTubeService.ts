export class YouTubeService {
    private apiKeys: string[];
    private currentKeyIndex: number = 0;
    private exhaustedKeys: Set<string> = new Set();
    private baseUrl: string = 'https://www.googleapis.com/youtube/v3';

    constructor() {
        this.apiKeys = [
            process.env.NEXT_PUBLIC_YOUTUBE_API_KEY1,
            process.env.NEXT_PUBLIC_YOUTUBE_API_KEY2,
            process.env.NEXT_PUBLIC_YOUTUBE_API_KEY3,
            process.env.NEXT_PUBLIC_YOUTUBE_API_KEY4,
            process.env.NEXT_PUBLIC_YOUTUBE_API_KEY5,
            process.env.NEXT_PUBLIC_YOUTUBE_API_KEY6,
        ].filter(Boolean) as string[];

        if (this.apiKeys.length === 0) {
            console.error("CRITICAL: Semua YouTube API Keys kosong! Harap isi .env");
        } else {
            console.log(`[YouTubeService] Berhasil memuat ${this.apiKeys.length} API Keys.`);
        }
    }

    public getKey(): string {
        if (this.apiKeys.length === 0) return '';

        let attempts = 0;
        let key = '';

        while (attempts < this.apiKeys.length) {
            key = this.apiKeys[this.currentKeyIndex];
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;

            if (!this.exhaustedKeys.has(key)) {
                return key;
            }
            attempts++;
        }

        // Jika semua key sudah exhausted, kembalikan key pertama sebagai fallback terakhir
        // (atau bisa juga throw error di sini jikalau mau strict)
        return this.apiKeys[0];
    }

    public async fetchWithRetry(urlFactory: (key: string) => string, options?: RequestInit): Promise<Response> {
        let attempts = 0;
        const maxAttempts = Math.max(1, this.apiKeys.length);

        while (attempts < maxAttempts) {
            const key = this.getKey() || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
            const url = urlFactory(key);
            const response = await fetch(url, options);

            if (!response.ok) {
                const clone = response.clone();
                try {
                    const errorData = await clone.json();
                    if (response.status === 403 && errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
                        console.warn(`[YouTubeService] Quota exceeded for key. Marking as exhausted and trying next key... (${attempts + 1}/${maxAttempts})`);
                        this.exhaustedKeys.add(key);
                        attempts++;
                        continue;
                    }
                } catch (e) {
                    // Mengabaikan error parsing JSON
                }
            }
            return response; // Return response jika berhasil atau jika error bukan karena quota
        }

        throw new Error("All YouTube API Keys have exceeded their quota!");
    }

    // Mengambil Live Chat ID
    async getLiveChatId(videoId: string): Promise<{ liveChatId: string | null, isReplay: boolean }> {
        const res = await this.fetchWithRetry((key) => `${this.baseUrl}/videos?part=liveStreamingDetails&id=${videoId}&key=${key}`);
        if (!res.ok) throw new Error("Failed to fetch video details");

        const data = await res.json();
        if (!data.items || data.items.length === 0) return { liveChatId: null, isReplay: false };

        const details = data.items[0].liveStreamingDetails;
        if (details && details.activeLiveChatId) {
            return { liveChatId: details.activeLiveChatId, isReplay: false };
        } else if (details) {
            return { liveChatId: null, isReplay: true };
        }

        return { liveChatId: null, isReplay: false };
    }

    // Mengambil Pesan Chat
    async getMessages(liveChatId: string): Promise<any[]> {
        const res = await this.fetchWithRetry((key) => `${this.baseUrl}/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${key}`);
        if (!res.ok) throw new Error("Failed to fetch messages");

        const data = await res.json();
        return data.items || [];
    }

    // Mengirim Pesan Chat
    async sendMessage(liveChatId: string, messageText: string, accessToken: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/liveChat/messages?part=snippet`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                snippet: {
                    liveChatId: liveChatId,
                    type: 'textMessageEvent',
                    textMessageDetails: { messageText },
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Detail Error YouTube API:", errorData);
            throw new Error(errorData.error?.message || "Gagal mengirim pesan");
        }
    }
}

// Export single instance (Singleton pattern)
export const ytService = new YouTubeService();
