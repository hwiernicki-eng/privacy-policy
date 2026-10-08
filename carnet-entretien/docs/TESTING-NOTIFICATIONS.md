# Recette manuelle des notifications (M7-T7)

À dérouler en production après chaque changement des canaux ou du job. Les envois réels ne s'automatisent pas en e2e. Préparer un compte de test avec un véhicule dont une échéance est `soon` (règle à 12 mois, référence il y a 11 mois et 10 jours) et une autre `overdue`.

Commandes utiles dans le CT :

```bash
docker compose --env-file .env -f deploy/docker-compose.yml exec -T app node dist/server/jobs/reminders.js --dry-run --user test@exemple.fr
docker compose --env-file .env -f deploy/docker-compose.yml exec -T app node dist/server/jobs/reminders.js --force --user test@exemple.fr
```

| # | Canal / appareil | Étapes | Attendu | OK |
|---|---|---|---|---|
| 1 | Email | Paramètres › Notifications › Email › « Envoyer un test » | Email reçu < 2 min, pas en spam, expéditeur `SMTP_FROM` | ☐ |
| 2 | Email | `reminders.js --force` | Digest : titre « Entretien : 1 en retard, 1 à prévoir », liste par véhicule, bouton « Ouvrir le carnet » | ☐ |
| 3 | Email | Clic « Se désabonner » du digest | Page de confirmation sans connexion ; canal email désactivé, les autres canaux intacts | ☐ |
| 4 | Email secondaire | Ajouter une 2e adresse | Email de vérification ; aucun digest tant que non vérifiée | ☐ |
| 5 | Android (Chrome) | « Activer sur cet appareil » puis test | Autorisation demandée ; notification reçue écran verrouillé, sans immatriculation | ☐ |
| 6 | Android | Clic sur la notification | Ouvre le tableau de bord (onglet existant réutilisé) | ☐ |
| 7 | Android | Économie d'énergie activée, `--force` | Notification reçue (éventuellement différée) | ☐ |
| 8 | iPhone (iOS ≥ 16.4) | Ouvrir l'app dans Safari sans l'installer | Message d'aide « Ajoutez à l'écran d'accueil », pas de bouton d'activation | ☐ |
| 9 | iPhone | Ajouter à l'écran d'accueil, ouvrir depuis l'icône, activer, test | Notification reçue | ☐ |
| 10 | Web Push | Révoquer l'autorisation dans le navigateur, `--force` | Abonnement expiré (410) ⇒ appareil retiré de la liste, aucune erreur bloquante | ☐ |
| 11 | ntfy | Saisir serveur + sujet, s'abonner dans l'app ntfy, test | Message reçu, priorité haute si un retard | ☐ |
| 12 | ntfy | Serveur hors `NTFY_ALLOWED_SERVERS` | Refus 400 avec message clair | ☐ |
| 13 | Tous | `--force` deux fois de suite | 2e exécution : aucun nouvel envoi | ☐ |
| 14 | Tous | Saisir l'intervention liée à l'échéance `soon`, `--force` le lendemain | Plus de rappel pour cette règle | ☐ |
| 15 | Échecs | Couper le SMTP, `--force` 5 jours (ou 5 fois avec `last_digest_date` remis à zéro) | Canal email désactivé, bandeau sur le tableau de bord | ☐ |
| 16 | Heure | Régler l'heure du rappel à H+15 min | Digest reçu au tick suivant H+15, une seule fois | ☐ |

Noter pour chaque écart : appareil, version d'OS et de navigateur, heure, extrait de log (`docker compose --env-file .env -f deploy/docker-compose.yml logs app --since 1h`).
