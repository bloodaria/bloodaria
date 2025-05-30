const DiscordRPC = require('discord-rpc');
const clientId = '1376610416074952744'; // Ton Application ID
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

let startTimestamp = new Date();
let rpcReady = false;

// Fonction pour définir l'activité
async function setActivity(
    details = 'Dans le launcher',
    state = 'En attente',
    largeImageKey = 'bloodarialarge',
    largeImageText = 'Bloodaria Launcher'
) {
    if (!rpcReady) return;

    rpc.setActivity({
        details: details,
        state: state,
        startTimestamp,
        largeImageKey: largeImageKey,
        largeImageText: largeImageText,
        buttons: [
            {
                label: '🌐 Site Web',
                url: 'https://www.bloodariamc.fr/'
            },
            {
                label: '💬 Rejoindre le Discord',
                url: 'https://discord.gg/TON_INVITE_DISCORD'
            }
        ],
        instance: false,
    });
}

// Quand la connexion à Discord est prête
rpc.on('ready', () => {
    rpcReady = true;
    setActivity();
    console.log('✅ Discord RPC connecté');
});

// Connexion à Discord
rpc.login({ clientId }).catch(error => {
    console.error('❌ Erreur de connexion Discord RPC :', error);
});

// Fonction pour couper proprement
function destroy() {
    if (rpcReady) {
        rpc.destroy();
        rpcReady = false;
        console.log('🔌 Discord RPC déconnecté');
    }
}

module.exports = {
    setActivity,
    destroy
};
