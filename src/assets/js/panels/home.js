/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
import { config, database, logger, changePanel, appdata, setStatus, pkg, popup } from '../utils.js'
const { Launch } = require('minecraft-java-core')
const { shell, ipcRenderer } = require('electron')

class Home {
    static id = "home";
    async init(config) {
        this.config = config;
        this.db = new database();

        // Affichage du pseudo utilisateur
        const configClient = await this.db.readData('configClient');
        let pseudo = 'Guest User';
        let authenticator = null;
        if (configClient && configClient.account_selected) {
            const account = await this.db.readData('accounts', configClient.account_selected);
            if (account && account.name) {
                pseudo = account.name;
                authenticator = account;
            }
        }
        document.querySelector('.user-name').textContent = pseudo;

        // Bouton Jouer : TOUJOURS actif, mais vérifie l'authentification au clic
        const playBtn = document.querySelector('.play-btn');
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
        playBtn.addEventListener('click', async () => {
            const configClient = await this.db.readData('configClient');
            let authenticator = null;
            if (configClient && configClient.account_selected) {
                authenticator = await this.db.readData('accounts', configClient.account_selected);
            }
            if (!authenticator) {
                new popup().openPopup({
                    title: 'Erreur',
                    content: 'Veuillez vous connecter pour jouer.',
                    color: 'red',
                    options: true
                });
                return;
            }
            const launch = new Launch();
            const launchOptions = {
                url: "https://launcher.rizyox.fr/files/?instance=Bloodaria", // à adapter si besoin
                authenticator: authenticator,
                timeout: 10000,
                path: `${await appdata()}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
                instance: "Bloodaria",
                version: "1.12.2",
                detached: false,
                downloadFileMultiple: configClient?.launcher_config?.download_multi || 5,
                intelEnabledMac: configClient?.launcher_config?.intelEnabledMac || false,
                loader: {
                    type: "none",
                    build: "",
                    enable: false
                },
                verify: true,
                ignored: [],
                java: {
                    path: configClient?.java_config?.java_path,
                },
                JVM_ARGS: [],
                GAME_ARGS: [],
                screen: {
                    width: configClient?.game_config?.screen_size?.width || 854,
                    height: configClient?.game_config?.screen_size?.height || 480
                },
                memory: {
                    min: `${(configClient?.java_config?.java_memory?.min || 2) * 1024}M`,
                    max: `${(configClient?.java_config?.java_memory?.max || 4) * 1024}M`
                }
            };
            await launch.Launch(launchOptions);
        });

        // Affichage dynamique des news (si tu veux garder la logique)
        this.news();

        // Icône settings (ouvre le panel settings)
        document.querySelector('.icon-settings').addEventListener('click', e => changePanel('settings'));
    }

    async news() {
        // Affiche les news dynamiquement dans la nouvelle section
        let newsElement = document.querySelector('.news-list');
        let news = await config.getNews().then(res => res).catch(err => false);
        if (news && news.length) {
            for (let News of news) {
                let blockNews = document.createElement('div');
                blockNews.classList.add('news-block');
                blockNews.innerHTML = `
                    <div class="news-header">
                        <img class="server-status-icon" src="assets/images/icon.png">
                        <div class="header-text">
                            <div class="title">${News.title}</div>
                        </div>
                        <div class="date">
                            <div class="day">${this.getdate(News.publish_date).day}</div>
                            <div class="month">${this.getdate(News.publish_date).month}</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>${News.content.replace(/\n/g, '</br>')}</p>
                            <p class="news-author">Auteur - <span>${News.author}</span></p>
                        </div>
                    </div>`
                newsElement.appendChild(blockNews);
            }
        } else {
            let blockNews = document.createElement('div');
            blockNews.classList.add('news-block');
            blockNews.innerHTML = `
                <div class="news-header">
                    <img class="server-status-icon" src="assets/images/icon.png">
                    <div class="header-text">
                        <div class="title">Aucune news disponible.</div>
                    </div>
                    <div class="date">
                        <div class="day">1</div>
                        <div class="month">Janvier</div>
                    </div>
                </div>
                <div class="news-content">
                    <div class="bbWrapper">
                        <p>Vous pourrez suivre ici toutes les news relatives au serveur.</p>
                    </div>
                </div>`
            newsElement.appendChild(blockNews);
        }
    }

    getdate(e) {
        let date = new Date(e);
        let day = date.getDate();
        let month = date.toLocaleString('fr-FR', { month: 'long' });
        return { day, month };
    }
}

export default Home;