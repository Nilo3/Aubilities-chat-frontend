/* eslint-disable @typescript-eslint/no-explicit-any */
import Pusher from 'pusher-js';

class PusherService {
    private pusher: Pusher | null = null;
    private currentChannel: any = null;

    init() {
        if (!this.pusher) {
            Pusher.logToConsole = true;
            
            this.pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY ?? '', {
                cluster: import.meta.env.VITE_PUSHER_CLUSTER ?? 'us2',
                forceTLS: true
            });
        }
        return this.pusher;
    }

    subscribeToChat(chatId: string, callback: (data: any) => void) {
        if (!this.pusher) {
            this.init();
        }
    
        // Disconnect previous channel if it exists
        if (this.currentChannel) {
            this.currentChannel.unbind();
            this.pusher?.unsubscribe(this.currentChannel.name);
        }
    
        // Subscribe to new channel
        const channelName = `chat.${chatId}`;
        
        this.currentChannel = this.pusher?.subscribe(channelName);
        
        this.currentChannel?.bind('pusher:subscription_error', (error: any) => {
            console.error(`❌ Error de suscripción al canal ${channelName}:`, error);
        });
    
        // Listen to both event names
        this.currentChannel?.bind('ChatResponseReceived', (data: any) => {
            callback(data);
        });
    
        this.currentChannel?.bind('App\\Events\\ChatResponseReceived', (data: any) => {
            callback(data);
        });
    }

    unsubscribeFromChat() {
        if (this.currentChannel) {
            this.currentChannel.unbind('ChatResponseReceived');
            this.pusher?.unsubscribe(this.currentChannel.name);
            this.currentChannel = null;
        }
    }

    disconnect() {
        this.unsubscribeFromChat();
        this.pusher?.disconnect();
        this.pusher = null;
    }
}

export const pusherService = new PusherService();