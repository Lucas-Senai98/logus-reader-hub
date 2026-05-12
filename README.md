# Jornal Logus

Aplicacao React/Vite com backend Express para servir o site, o painel administrativo, a API e os PDFs enviados pelo admin.

## Producao em VPS

Requisitos:

- Node.js 20 ou superior
- Nginx
- PM2 ou systemd

Comandos principais:

```bash
npm install
npm run build
npm start
```

Em producao, crie `/var/www/jornal/.env` com base em `.env.example`.

```bash
PORT=3001
ADMIN_USER=admin
ADMIN_PASS=gere-uma-senha-forte
ADMIN_SECRET=$(openssl rand -hex 32)
ADMIN_TOKEN_TTL_MS=43200000
VITE_API_BASE_URL=
```

O servidor falha ao iniciar com `NODE_ENV=production` se `ADMIN_PASS` ou `ADMIN_SECRET` nao estiverem definidos.

## Nginx

Use `deploy/nginx-jornal.conf` em `/etc/nginx/sites-available/jornal`.

O arquivo esta configurado como catch-all com `server_name _;`, o que funciona quando a VPS hospeda apenas este site. Quando o dominio definitivo estiver apontado para a VPS, troque essa linha por:

```nginx
server_name seu-dominio.com.br www.seu-dominio.com.br;
```

Depois ative e recarregue:

```bash
sudo ln -s /etc/nginx/sites-available/jornal /etc/nginx/sites-enabled/jornal
sudo nginx -t
sudo systemctl reload nginx
```

## Processo Node

Opcao systemd:

```bash
sudo cp deploy/jornal.service /etc/systemd/system/jornal.service
sudo systemctl daemon-reload
sudo systemctl enable --now jornal
```

Opcao PM2:

```bash
sudo mkdir -p /var/log/jornal-logus
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

## Dados persistentes e backup

Preserve estes caminhos entre deploys:

- `server/data/edicoes.json`
- `server/uploads/pdfs/`

Backup manual:

```bash
deploy/backup-jornal.sh
```

Exemplo de cron diario as 03:30:

```cron
30 3 * * * APP_DIR=/var/www/jornal BACKUP_DIR=/var/backups/jornal /var/www/jornal/deploy/backup-jornal.sh >/var/log/jornal-backup.log 2>&1
```
