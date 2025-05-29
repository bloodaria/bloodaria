const DiscordRPC = require('discord-rpc');
const { ipcRenderer } = require('electron');

class DiscordPresence {
    constructor() {
        this.clientId = ''; // Remplacez par votre Client ID Discord
        this.rpc = new DiscordRPC.Client({ transport: 'ipc' });
        this.startTimestamp = new Date();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Enregistrer l'ID client
            DiscordRPC.register(this.clientId);
            
            // Configurer les événements
            this.rpc.on('ready', () => {
                console.log('Discord RPC connecté!');
                this.setLauncherActivity();
            });
            
            // Se connecter à Discord
            await this.rpc.login({ clientId: this.clientId });
            this.initialized = true;
        } catch (error) {
            console.error('Erreur lors de la connexion à Discord RPC:', error);
        }
    }

    setLauncherActivity() {
        if (!this.initialized) return;
        
        this.rpc.setActivity({
            details: 'Dans le launcher',
            state: 'En attente',
            largeImageKey: 'bloodaria_logo', // Nom de l'image large que vous avez uploadée
            largeImageText: 'Bloodaria',
            smallImageKey: 'launcher_icon', // Nom de l'image small que vous avez uploadée
            smallImageText: 'Launcher',
            startTimestamp: this.startTimestamp,
            instance: false,
        });
    }

    setGameActivity(serverName, playerCount) {
        if (!this.initialized) return;
        
        this.rpc.setActivity({
            details: `Joue sur ${serverName}`,
            state: `${playerCount} joueurs en ligne`,
            largeImageKey: 'bloodaria_logo', // Nom de l'image large que vous avez uploadée
            largeImageText: serverName,
            smallImageKey: 'minecraft_icon', // Nom de l'image small que vous avez uploadée
            smallImageText: 'In Game',
            startTimestamp: new Date(),
            instance: false,
        });
    }

    destroy() {
        if (this.initialized) {
            this.rpc.destroy();
            this.initialized = false;
        }
    }
}

module.exports = new DiscordPresence();