export class YouTubeService {
    private apiKey: string;
    private baseUrl: string = 'https://www.googleapis.com/youtube/v3';

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
        if (!this.apiKey) {
            console.warn("YouTube API Key is missing!");
        }
    }

    // Mengambil Live Chat ID
    async getLiveChatId(videoId: string): Promise<{ liveChatId: string | null, isReplay: boolean }> {
        const res = await fetch(`${this.baseUrl}/videos?part=liveStreamingDetails&id=${videoId}&key=${this.apiKey}`);
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
        const res = await fetch(`${this.baseUrl}/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${this.apiKey}`);
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
            throw new Error("Gagal mengirim pesan");
        }
    }
}

// Export single instance (Singleton pattern)
export const ytService = new YouTubeService();
