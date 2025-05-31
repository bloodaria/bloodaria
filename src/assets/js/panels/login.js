/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
const { AZauth, Mojang } = require('minecraft-java-core');
const { ipcRenderer } = require('electron');
const mysql = require('mysql2/promise');

import { popup, database, changePanel, accountSelect, addAccount, config, setStatus } from '../utils.js';

class Login {
    static id = "login";

    async init(config) {
        this.config = config;
        this.db = new database();

        if (typeof this.config.online == 'boolean') {
            this.config.online ? this.getMicrosoft() : this.getCrack()
        } else if (typeof this.config.online == 'string') {
            if (this.config.online === 'sql') {
                this.getSQL();
            } else if (this.config.online.match(/^(http|https):\/\/[^ "]+$/)) {
                this.getAZauth();
            }
        }

        document.querySelector('.cancel-home').addEventListener('click', () => {
            document.querySelector('.cancel-home').style.display = 'none'
            changePanel('settings')
        })

        // GESTION CLIC SUR LES BOUTONS SOCIAUX
        document.querySelectorAll('.social-button').forEach(button => {
            button.addEventListener('click', () => {
                const url = button.getAttribute('data-url');
                if (!url) return;

                // Si on est dans Electron, utiliser ipcRenderer pour ouvrir en externe
                if (ipcRenderer) {
                    ipcRenderer.invoke('open-external-link', url);
                } else {
                    // Sinon navigateur classique
                    window.open(url, '_blank');
                }
            });
        });

        // GESTION CLIC BOUTON INSCRIPTION
        document.querySelectorAll('.register').forEach(button => {
            button.addEventListener('click', () => {
                const url = button.getAttribute('data-url');
                if (!url) return;

                if (ipcRenderer) {
                    ipcRenderer.invoke('open-external-link', url);
                } else {
                    window.open(url, '_blank');
                }
            });
        });
    }

    async getMicrosoft() {
        console.log('Initializing Microsoft login...');
        let popupLogin = new popup();
        let loginHome = document.querySelector('.login-home');
        let microsoftBtn = document.querySelector('.connect-home');
        loginHome.style.display = 'block';

        microsoftBtn.addEventListener("click", () => {
            popupLogin.openPopup({
                title: 'Connexion',
                content: 'Veuillez patienter...',
                color: 'var(--color)'
            });

            ipcRenderer.invoke('Microsoft-window', this.config.client_id).then(async account_connect => {
                if (account_connect == 'cancel' || !account_connect) {
                    popupLogin.closePopup();
                    return;
                } else {
                    await this.saveData(account_connect)
                    popupLogin.closePopup();
                }

            }).catch(err => {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: err,
                    options: true
                });
            });
        })
    }

    async getCrack() {
        console.log('Initializing offline login...');
        let popupLogin = new popup();
        let loginOffline = document.querySelector('.login-offline');

        let emailOffline = document.querySelector('.email-offline');
        let connectOffline = document.querySelector('.connect-offline');
        loginOffline.style.display = 'block';

        connectOffline.addEventListener('click', async () => {
            if (emailOffline.value.length < 3) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Votre pseudo doit faire au moins 3 caractères.',
                    options: true
                });
                return;
            }

            if (emailOffline.value.match(/ /g)) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Votre pseudo ne doit pas contenir d\'espaces.',
                    options: true
                });
                return;
            }

            let MojangConnect = await Mojang.login(emailOffline.value);

            if (MojangConnect.error) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: MojangConnect.message,
                    options: true
                });
                return;
            }
            await this.saveData(MojangConnect)
            popupLogin.closePopup();
        });
    }

    async getAZauth() {
        console.log('Initializing AZauth login...');
        let AZauthClient = new AZauth(this.config.online);
        let PopupLogin = new popup();
        let loginAZauth = document.querySelector('.login-AZauth');
        let loginAZauthA2F = document.querySelector('.login-AZauth-A2F');

        let AZauthEmail = document.querySelector('.email-AZauth');
        let AZauthPassword = document.querySelector('.password-AZauth');
        let AZauthA2F = document.querySelector('.A2F-AZauth');
        let connectAZauthA2F = document.querySelector('.connect-AZauth-A2F');
        let AZauthConnectBTN = document.querySelector('.connect-AZauth');
        let AZauthCancelA2F = document.querySelector('.cancel-AZauth-A2F');
        let togglePasswordBtn = document.querySelector('.toggle-password');

        loginAZauth.style.display = 'block';

        // ** TOGGLE MOT DE PASSE **
        if (togglePasswordBtn && AZauthPassword) {
            togglePasswordBtn.addEventListener('click', () => {
                const icon = togglePasswordBtn.querySelector('i');

                if (AZauthPassword.type === 'password') {
                    AZauthPassword.type = 'text';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    AZauthPassword.type = 'password';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            });
        }

        AZauthConnectBTN.addEventListener('click', async () => {
            PopupLogin.openPopup({
                title: 'Connexion en cours...',
                content: 'Veuillez patienter...',
                color: 'var(--color)'
            });

            if (AZauthEmail.value == '' || AZauthPassword.value == '') {
                PopupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Veuillez remplir tous les champs.',
                    options: true
                });
                return;
            }

            let AZauthConnect = await AZauthClient.login(AZauthEmail.value, AZauthPassword.value);

            if (AZauthConnect.error) {
                PopupLogin.openPopup({
                    title: 'Erreur',
                    content: AZauthConnect.message,
                    options: true
                });
                return;
            } else if (AZauthConnect.A2F) {
                loginAZauthA2F.style.display = 'block';
                loginAZauth.style.display = 'none';
                PopupLogin.closePopup();

                AZauthCancelA2F.addEventListener('click', () => {
                    loginAZauthA2F.style.display = 'none';
                    loginAZauth.style.display = 'block';
                });

                connectAZauthA2F.addEventListener('click', async () => {
                    PopupLogin.openPopup({
                        title: 'Connexion en cours...',
                        content: 'Veuillez patienter...',
                        color: 'var(--color)'
                    });

                    if (AZauthA2F.value == '') {
                        PopupLogin.openPopup({
                            title: 'Erreur',
                            content: 'Veuillez entrer le code A2F.',
                            options: true
                        });
                        return;
                    }

                    AZauthConnect = await AZauthClient.login(AZauthEmail.value, AZauthPassword.value, AZauthA2F.value);

                    if (AZauthConnect.error) {
                        PopupLogin.openPopup({
                            title: 'Erreur',
                            content: AZauthConnect.message,
                            options: true
                        });
                        return;
                    }

                    await this.saveData(AZauthConnect)
                    PopupLogin.closePopup();
                });
            } else if (!AZauthConnect.A2F) {
                await this.saveData(AZauthConnect)
                PopupLogin.closePopup();
            }
        });
    }

    async getSQL() {
        // Vérifier si la méthode SQL est activée
        if (!this.config.auth?.methods?.includes('sql') || !this.config.auth?.api?.enabled) {
            console.log('SQL authentication is disabled');
            return;
        }

        // Vérifier que l'URL de l'API utilise HTTPS
        const apiConfig = this.config.auth.api;
        if (!apiConfig.url.startsWith('https://')) {
            console.error('API URL must use HTTPS');
            return;
        }

        console.log('Initializing SQL login...');
        let popupLogin = new popup();
        let loginSQL = document.querySelector('.login-sql');
        let usernameSQL = document.querySelector('.username-sql');
        let passwordSQL = document.querySelector('.password-sql');
        let connectSQL = document.querySelector('.connect-sql');
        let togglePasswordBtn = document.querySelector('.login-sql .toggle-password');

        // Vérification de l'existence des éléments
        if (!loginSQL || !usernameSQL || !passwordSQL || !connectSQL || !togglePasswordBtn) {
            console.error('Un ou plusieurs éléments du formulaire SQL sont introuvables.');
            return;
        }

        loginSQL.style.display = 'block';

        // Gestion du bouton œil pour afficher/masquer le mot de passe
        togglePasswordBtn.addEventListener('click', () => {
            const icon = togglePasswordBtn.querySelector('i');
            if (passwordSQL.type === 'password') {
                passwordSQL.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                passwordSQL.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });

        // Compteur de tentatives de connexion
        let loginAttempts = 0;
        const MAX_ATTEMPTS = 5;
        const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
        let lastAttemptTime = 0;

        connectSQL.addEventListener('click', async () => {
            // Vérifier le nombre de tentatives
            const now = Date.now();
            if (loginAttempts >= MAX_ATTEMPTS) {
                if (now - lastAttemptTime < LOCKOUT_TIME) {
                    const remainingTime = Math.ceil((LOCKOUT_TIME - (now - lastAttemptTime)) / 60000);
                    popupLogin.openPopup({
                        title: 'Compte bloqué',
                        content: `Trop de tentatives de connexion. Réessayez dans ${remainingTime} minutes.`,
                        options: true
                    });
                    return;
                } else {
                    // Réinitialiser le compteur après la période de blocage
                    loginAttempts = 0;
                }
            }

            if (!usernameSQL.value || !passwordSQL.value) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Veuillez remplir tous les champs.',
                    options: true
                });
                return;
            }

            // Validation basique des entrées
            if (usernameSQL.value.length < 3 || usernameSQL.value.length > 20) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Le nom d\'utilisateur doit faire entre 3 et 20 caractères.',
                    options: true
                });
                return;
            }

            if (passwordSQL.value.length < 8) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Le mot de passe doit faire au moins 8 caractères.',
                    options: true
                });
                return;
            }

            popupLogin.openPopup({
                title: 'Connexion en cours...',
                content: 'Vérification des identifiants...',
                color: 'var(--color)'
            });

            try {
                loginAttempts++;
                lastAttemptTime = now;

                const response = await fetch(`${apiConfig.url}${apiConfig.endpoints.login}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        username: usernameSQL.value,
                        password: passwordSQL.value
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Erreur de connexion');
                }

                // Vérifier la présence du token
                if (!data.token) {
                    throw new Error('Réponse invalide du serveur');
                }

                // Création de l'objet compte
                const accountData = {
                    name: data.username,
                    meta: {
                        type: 'SQL',
                        userId: data.id,
                        username: data.username,
                        email: data.email,
                        token: data.token,
                        tokenExpiry: data.expiry || (Date.now() + 3600000) // 1 heure par défaut
                    }
                };

                await this.saveData(accountData);
                popupLogin.closePopup();

            } catch (error) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: error.message,
                    options: true
                });
            }
        });
    }

    async saveData(connectionData) {
        let configClient = await this.db.readData('configClient');
        let account = await this.db.createData('accounts', connectionData)
        let instanceSelect = configClient.instance_selct
        let instancesList = await config.getInstanceList()
        configClient.account_selected = account.ID;

        for (let instance of instancesList) {
            if (instance.whitelistActive) {
                let whitelist = instance.whitelist.find(whitelist => whitelist == account.name)
                if (whitelist !== account.name) {
                    if (instance.name == instanceSelect) {
                        let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
                        configClient.instance_selct = newInstanceSelect.name
                        await setStatus(newInstanceSelect.status)
                    }
                }
            }
        }

        await this.db.updateData('configClient', configClient);
        await addAccount(account);
        await accountSelect(account);
        changePanel('home');
    }
}

export default Login;
