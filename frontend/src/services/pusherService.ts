/* eslint-disable @typescript-eslint/no-explicit-any */
import Pusher from 'pusher-js';

class PusherService {
    private pusher: Pusher | null = null;
    private currentChannel: any = null;

    init() {
        if (!this.pusher) {
            // Habilitar logs de Pusher para debugging
            Pusher.logToConsole = true;
            
            this.pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY || '', {
                cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
                forceTLS: true
            });

            // Eventos de conexión para debugging
            this.pusher.connection.bind('connected', () => {
                console.log('✅ Pusher conectado');
            });

            this.pusher.connection.bind('disconnected', () => {
                console.log('❌ Pusher desconectado');
            });

            this.pusher.connection.bind('error', (error: any) => {
                console.error('❌ Error de Pusher:', error);
            });
        }
        return this.pusher;
    }

    subscribeToChat(chatId: string, callback: (data: any) => void) {
        if (!this.pusher) {
            this.init();
        }
    
        // Desconectar canal anterior si existe
        if (this.currentChannel) {
            this.currentChannel.unbind();
            this.pusher?.unsubscribe(this.currentChannel.name);
        }
    
        // Suscribirse al nuevo canal
        const channelName = `chat.${chatId}`;
        console.log(`🔔 Suscribiéndose al canal: ${channelName}`);
        
        this.currentChannel = this.pusher?.subscribe(channelName);
        
        this.currentChannel?.bind('pusher:subscription_succeeded', () => {
            console.log(`✅ Suscripción exitosa al canal: ${channelName}`);
        });
    
        this.currentChannel?.bind('pusher:subscription_error', (error: any) => {
            console.error(`❌ Error de suscripción al canal ${channelName}:`, error);
        });
    
        // Escuchar ambos nombres del evento
        this.currentChannel?.bind('ChatResponseReceived', (data: any) => {
            console.log('📨 Evento ChatResponseReceived recibido:', data);
            callback(data);
        });
    
        this.currentChannel?.bind('App\\Events\\ChatResponseReceived', (data: any) => {
            console.log('📨 Evento App\\Events\\ChatResponseReceived recibido:', data);
            callback(data);
        });
    
        // Escuchar TODOS los eventos para debugging
        this.currentChannel?.bind_global((eventName: string, data: any) => {
            console.log(`🔔 Evento recibido: ${eventName}`, data);
        });
    }

    unsubscribeFromChat() {
        if (this.currentChannel) {
            console.log('🔕 Desconectando del canal:', this.currentChannel.name);
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