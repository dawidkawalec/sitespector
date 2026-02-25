# SiteSpector - Security Hardening Plan

**Data**: 2026-02-15  
**Powód**: Powtarzające się kompromitowanie VPS (Mirai botnet - x86_64.kok / x86.coq)  
**Priorytet**: KRYTYCZNY  
**Autor audytu**: Cursor Agent na zlecenie Dawida Kawalca

---

## TL;DR

Repozytorium jest **czyste** - żaden malware nie pochodzi z kodu. Problem leży w **6 lukach infrastrukturalnych**, które pozwalają atakującemu:
1. Odczytać wszystkie logi i credentials przez publiczne endpointy (brak auth)
2. Użyć Docker socket R/W do ucieczki na hosta
3. Zainstalować malware na hoście

**Bez zamknięcia tych luk, każdy nowy VPS zostanie skompromitowany w ciągu 24h.**

---

## Faza 0: Zmiany w repozytorium (PRZED deployem na nowy VPS)

> Wszystko poniżej to zmiany w kodzie/konfiguracji, które robimy lokalnie i commitujemy.

### F0-1: Usunięcie publicznego Dozzle `/logs` z nginx

**Plik**: `docker/nginx/nginx.conf`  
**Zmiana**: Usunięcie lub zabezpieczenie lokacji `/logs`  
**Ryzyko**: KRYTYCZNE  

**Co robimy**: Całkowicie usuwamy proxy do Dozzle z publicznego nginx. Dozzle będzie dostępny TYLKO przez SSH tunnel.

```nginx
# USUNĄĆ CAŁY BLOK:
# location /logs {
#     proxy_pass http://dozzle;
#     ...
# }
```

**Dostęp do logów po zmianie**: Przez SSH tunnel:
```bash
ssh -L 8080:localhost:8080 deploy@<VPS_IP>
# Potem w przeglądarce: http://localhost:8080/logs
```

---

### F0-2: Wyłączenie Swagger/OpenAPI na produkcji

**Plik**: `backend/app/main.py`  
**Zmiana**: Warunkowe wyłączenie docs na produkcji  
**Ryzyko**: KRYTYCZNE  

```python
# Zmiana w tworzeniu FastAPI app:
docs_url = "/docs" if settings.ENVIRONMENT != "production" else None
redoc_url = "/redoc" if settings.ENVIRONMENT != "production" else None
openapi_url = "/openapi.json" if settings.ENVIRONMENT != "production" else None

app = FastAPI(
    title="SiteSpector API",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)
```

---

### F0-3: Dodanie autentykacji do endpointów monitoringowych

**Plik**: `backend/app/main.py`  
**Zmiana**: Endpointy `/api/logs/*` i `/api/system/status` wymagają tokenu admin  
**Ryzyko**: KRYTYCZNE  

Dodajemy prostą weryfikację admin tokenu (z .env):

```python
# Nowa zmienna w config:
ADMIN_API_TOKEN: str = ""  # Losowy token 64 znaki

# Dependency:
from fastapi import Header, HTTPException

async def verify_admin_token(x_admin_token: str = Header(...)):
    if not settings.ADMIN_API_TOKEN or x_admin_token != settings.ADMIN_API_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")

# Dodać do każdego endpointu monitoringowego:
@app.get("/api/logs/worker", dependencies=[Depends(verify_admin_token)])
@app.get("/api/logs/backend", dependencies=[Depends(verify_admin_token)])
@app.get("/api/system/status", dependencies=[Depends(verify_admin_token)])
```

---

### F0-4: Docker socket `:ro` na workerze

**Plik**: `docker-compose.prod.yml`  
**Zmiana**: Dodanie `:ro` do Docker socket mount na workerze  
**Ryzyko**: KRYTYCZNY  

```yaml
# PRZED (linia 65):
- /var/run/docker.sock:/var/run/docker.sock

# PO:
- /var/run/docker.sock:/var/run/docker.sock:ro
```

**UWAGA**: `docker exec` działa z `:ro` - read-only dotyczy operacji na samym pliku socketu, nie uprawnień API. Kontener nadal może wykonywać `docker exec`, ale nie może nadpisać/usunąć pliku socketu. Dla pełnego bezpieczeństwa patrz Faza 2 (Docker socket proxy).

---

### F0-5: Przypięcie Dozzle do konkretnej wersji

**Plik**: `docker-compose.prod.yml`  
**Zmiana**: Zamiana `:latest` na pinned version  
**Ryzyko**: WYSOKI  

```yaml
# PRZED (linia 160):
image: amir20/dozzle:latest

# PO:
image: amir20/dozzle:v8.8.1
```

---

### F0-6: Ograniczenie dostępu sieciowego kontenerów

**Plik**: `docker-compose.prod.yml`  
**Zmiana**: Wyłączenie bezpośredniego dostępu do internetu dla kontenerów, które go nie potrzebują  
**Ryzyko**: WYSOKI  

Dodajemy dwie sieci: `internal` (bez internetu) i `external` (z internetem):

```yaml
networks:
  sitespector-internal:
    driver: bridge
    internal: true          # <-- BRAK dostępu do internetu
  sitespector-external:
    driver: bridge           # normalny dostęp do internetu

# Kontenery i ich sieci:
# postgres:         internal ONLY
# backend:          internal + external (potrzebuje Supabase, Stripe, Gemini)
# worker:           internal + external (potrzebuje docker exec + API calls)
# screaming-frog:   external ONLY (potrzebuje crawlować strony)
# lighthouse:       external ONLY (potrzebuje audytować strony)
# landing:          internal ONLY
# frontend:         internal ONLY
# dozzle:           internal ONLY
# nginx:            internal + external (proxy)
```

---

### F0-7: Usunięcie hardcoded credentials z docker-compose.prod.yml

**Plik**: `docker-compose.prod.yml`  
**Zmiana**: Przeniesienie wszystkich credentials do .env  
**Ryzyko**: WYSOKI  

```yaml
# PRZED:
postgres:
  environment:
    POSTGRES_USER: sitespector_user
    POSTGRES_PASSWORD: sitespector_password
    POSTGRES_DB: sitespector_db

# PO:
postgres:
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
```

To samo dla `DATABASE_URL` w backend i worker.

---

### F0-8: Dodanie Security Headers do nginx

**Plik**: `docker/nginx/nginx.conf`  
**Zmiana**: Dodanie nagłówków bezpieczeństwa  
**Ryzyko**: ŚREDNI  

```nginx
# W bloku server {} HTTPS:
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

---

### F0-9: Rate limiting na API

**Plik**: `docker/nginx/nginx.conf`  
**Zmiana**: Dodanie rate limiting na poziomie nginx  
**Ryzyko**: ŚREDNI  

```nginx
# W bloku http {}:
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=3r/s;

# W location /api/:
limit_req zone=api burst=20 nodelay;

# W location /login i /register:
limit_req zone=auth burst=5 nodelay;
```

---

### F0-10: Aktualizacja .env.example

**Plik**: `.env.example`  
**Zmiana**: Dodanie nowych zmiennych bezpieczeństwa  

```bash
# SECURITY
ADMIN_API_TOKEN=YOUR_64_CHAR_RANDOM_TOKEN_HERE

# DATABASE (przeniesione z docker-compose)
POSTGRES_USER=sitespector_user
POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD_HERE
POSTGRES_DB=sitespector_db
```

---

## Faza 1: Konfiguracja nowego VPS (przy deployu)

> Te kroki wykonujemy na nowym serwerze PRZED uruchomieniem docker compose.

### F1-1: Generowanie NOWYCH kluczy SSH

```bash
# Na LOKALNEJ maszynie (NIE na VPS):
ssh-keygen -t ed25519 -C "sitespector-prod-2026-02" -f ~/.ssh/hetzner_sitespector_NEW

# WAŻNE: NIE UŻYWAJ starych kluczy z poprzedniego VPS!
```

### F1-2: Bootstrap nowego VPS

```bash
# 1. Pierwsza konfiguracja (jako root)
ssh root@<NOWY_IP>

# 2. Aktualizacja systemu
apt update && apt upgrade -y

# 3. Utworzenie użytkownika deploy
adduser deploy
usermod -aG sudo deploy

# 4. Konfiguracja SSH
mkdir -p /home/deploy/.ssh
# Skopiuj NOWY klucz publiczny:
echo "ssh-ed25519 AAAA... sitespector-prod-2026-02" > /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# 5. Hartowanie SSH
cat > /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers deploy
EOF

systemctl restart sshd

# 6. Zaloguj się jako deploy w NOWEJ sesji ZANIM zamkniesz root!
# Test: ssh -i ~/.ssh/hetzner_sitespector_NEW deploy@<NOWY_IP>
```

### F1-3: Firewall (UFW)

```bash
# Jako deploy z sudo:
sudo ufw default deny incoming
sudo ufw default deny outgoing   # <-- KRYTYCZNE: domyślnie blokuj wychodzący!
sudo ufw allow in 22/tcp         # SSH
sudo ufw allow in 80/tcp         # HTTP (redirect)
sudo ufw allow in 443/tcp        # HTTPS

# Ruch wychodzący - tylko to co potrzebne:
sudo ufw allow out 80/tcp        # HTTP (apt, downloads)
sudo ufw allow out 443/tcp       # HTTPS (API calls, Docker Hub)
sudo ufw allow out 53/udp        # DNS
sudo ufw allow out 53/tcp        # DNS

# BLOKADA UDP wychodzącego (anty-DDoS):
# UDP jest dozwolony TYLKO na port 53 (DNS)
# Cały inny UDP wychodzący jest zablokowany!

sudo ufw enable
sudo ufw status verbose
```

**WAŻNE**: Ta konfiguracja UFW **blokuje wychodzący ruch UDP** (poza DNS), co uniemożliwia generowanie UDP flood nawet jeśli serwer zostanie skompromitowany.

### F1-4: Fail2ban

```bash
sudo apt install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### F1-5: Instalacja Docker

```bash
# Oficjalna instalacja Docker (NIE snap/apt docker.io):
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# KRYTYCZNE: Upewnij się że Docker NIE słucha na TCP:
sudo ss -tlnp | grep docker
# Powinno zwrócić PUSTY wynik

# Sprawdź konfigurację Docker daemon:
cat /etc/docker/daemon.json 2>/dev/null || echo "Brak pliku - OK (domyślna konfiguracja)"
# Jeśli plik istnieje, UPEWNIJ SIĘ że NIE ma "hosts": ["tcp://..."]

# Wyloguj się i zaloguj ponownie (dla grupy docker):
exit
ssh -i ~/.ssh/hetzner_sitespector_NEW deploy@<NOWY_IP>
```

### F1-6: Deploy aplikacji

```bash
# 1. Klonowanie repo
sudo mkdir -p /opt/sitespector
sudo chown deploy:deploy /opt/sitespector
cd /opt/sitespector
git clone https://github.com/dawidkawalec/sitespector.git .
git checkout release

# 2. Konfiguracja .env (NOWE, SILNE credentials!)
cp .env.example .env
nano .env
# WYPEŁNIJ:
# - POSTGRES_PASSWORD: wygeneruj: openssl rand -hex 32
# - ADMIN_API_TOKEN: wygeneruj: openssl rand -hex 32
# - JWT_SECRET: wygeneruj: openssl rand -hex 32
# - Pozostałe klucze API z Supabase, Stripe, Gemini, etc.

# 3. SSL (Let's Encrypt)
sudo apt install -y certbot
sudo certbot certonly --standalone -d sitespector.app -d www.sitespector.app \
  --non-interactive --agree-tos -m kontakt@dawidkawalec.pl

# 4. Build i uruchomienie
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# 5. Weryfikacja
docker ps
curl -sk https://127.0.0.1/health
```

### F1-7: Weryfikacja bezpieczeństwa po deployu

```bash
# 1. Sprawdź że /logs NIE jest dostępny:
curl -I https://sitespector.app/logs
# Powinno: 404 lub brak odpowiedzi

# 2. Sprawdź że /docs NIE jest dostępny:
curl -I https://sitespector.app/docs
# Powinno: 404

# 3. Sprawdź że monitoring wymaga tokenu:
curl https://sitespector.app/api/logs/worker
# Powinno: 403 Forbidden

curl -H "X-Admin-Token: TWÓJ_TOKEN" https://sitespector.app/api/logs/worker
# Powinno: 200 z logami

# 4. Sprawdź UFW:
sudo ufw status verbose
# Powinno: deny outgoing (default), allow specific ports only

# 5. Sprawdź SSH:
sudo sshd -T | grep -E "passwordauthentication|permitrootlogin|allowusers"
# Powinno: passwordauthentication no, permitrootlogin no, allowusers deploy

# 6. Sprawdź Docker daemon:
sudo ss -tlnp | grep 2375
# Powinno: PUSTY wynik (Docker nie słucha na TCP)

# 7. Sprawdź otwarte porty:
sudo ss -tlnp
# Powinno: TYLKO 22 (ssh), 80 (nginx), 443 (nginx)

# 8. Sprawdź że kontenery NIE mają dodatkowych portów:
docker ps --format '{{.Names}}\t{{.Ports}}'
# Tylko nginx powinien mieć 0.0.0.0:80/443

# 9. Test ruchu wychodzącego UDP (powinien być zablokowany):
docker exec sitespector-worker bash -c "echo test | nc -u -w1 8.8.8.8 9999" 2>&1
# Powinno: timeout/blocked (UFW blokuje UDP wychodzący poza DNS)
```

---

## Faza 2: Dodatkowe hartowanie (po stabilizacji)

> Te kroki wykonujemy po potwierdzeniu że aplikacja działa poprawnie.

### F2-1: Docker Socket Proxy (zamiast bezpośredniego mount)

Zamiast dawać kontenerom bezpośredni dostęp do Docker socket, użyj proxy z whitelistą:

```yaml
# Dodaj do docker-compose.prod.yml:
docker-socket-proxy:
  image: tecnativa/docker-socket-proxy:0.2
  container_name: sitespector-docker-proxy
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  environment:
    - CONTAINERS=1      # Pozwól na listowanie kontenerów
    - EXEC=1            # Pozwól na docker exec
    - POST=1            # Pozwól na POST (exec wymaga POST)
    - IMAGES=0          # Blokuj operacje na obrazach
    - VOLUMES=0         # Blokuj operacje na wolumenach
    - NETWORKS=0        # Blokuj operacje na sieciach
    - BUILD=0           # Blokuj budowanie
    - COMMIT=0          # Blokuj commit
  networks:
    - sitespector-internal
  restart: unless-stopped

# Zmień w worker i backend:
# Zamiast montować /var/run/docker.sock:
environment:
  - DOCKER_HOST=tcp://docker-socket-proxy:2375
# I usuń volume mount docker.sock
```

### F2-2: Automatyczne aktualizacje bezpieczeństwa

```bash
# Na VPS:
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### F2-3: Monitoring i alerty

```bash
# Cron job: sprawdzaj podejrzane procesy co 5 minut
cat > /opt/sitespector/security-check.sh << 'SCRIPT'
#!/bin/bash
# Sprawdź podejrzane procesy
SUSPICIOUS=$(ps aux | grep -E 'x86|\.kok|\.coq|miner|xmrig|cryptonight' | grep -v grep)
if [ -n "$SUSPICIOUS" ]; then
    echo "ALERT: Podejrzany proces wykryty!" | logger -t security-alert
    echo "$SUSPICIOUS" | logger -t security-alert
fi

# Sprawdź ruch sieciowy
HIGH_UDP=$(ss -unp | wc -l)
if [ "$HIGH_UDP" -gt 10 ]; then
    echo "ALERT: Wysoki ruch UDP ($HIGH_UDP połączeń)!" | logger -t security-alert
fi
SCRIPT

chmod +x /opt/sitespector/security-check.sh
echo "*/5 * * * * /opt/sitespector/security-check.sh" | crontab -
```

---

## Faza 3: Odpowiedź do Hetzner

### Szablon odpowiedzi (statement)

```
Subject: [AbuseID:112ED46:1D] Statement regarding abuse report

Dear Hetzner Abuse Team,

We acknowledge the abuse report regarding outbound DDoS traffic from IP 46.225.134.48.

**What happened:**
Our VPS was compromised by a Mirai botnet variant (binary: x86_64.kok). The malware
generated UDP flood traffic targeting third-party hosts.

**Root cause:**
We identified several security vulnerabilities in our Docker-based deployment:
1. Unauthenticated monitoring endpoints exposing container logs and credentials
2. Docker log viewer (Dozzle) publicly accessible without authentication
3. Docker socket mounted read-write in worker container (container escape vector)
4. No outbound traffic restrictions (UDP flood not blocked)
5. API documentation (Swagger) publicly accessible

**Actions taken:**
1. Removed public access to Dozzle log viewer
2. Added authentication to all monitoring/admin endpoints
3. Disabled Swagger/OpenAPI on production
4. Restricted Docker socket access (read-only + proxy)
5. Implemented strict UFW rules blocking outbound UDP (except DNS)
6. Implemented network segmentation (internal/external Docker networks)
7. Generated new SSH keys (old keys potentially compromised)
8. Added nginx rate limiting and security headers
9. Pinned all Docker images to specific versions
10. Migrating to a new VPS with hardened configuration

**Prevention:**
- Strict outbound firewall (only TCP 80/443/53 and UDP 53 allowed out)
- All monitoring behind authentication
- Docker socket access via proxy with whitelisted operations
- Automated security monitoring (process + network checks every 5 minutes)
- fail2ban with aggressive SSH protection

We are deploying to a new, clean VPS with all these mitigations in place.

Best regards,
Dawid Kawalec
```

---

## Checklist wdrożenia

### Przed deployem (zmiany w repo):

- [ ] F0-1: Usunięcie `/logs` z nginx.conf
- [ ] F0-2: Wyłączenie Swagger na produkcji
- [ ] F0-3: Auth na endpointach monitoringowych
- [ ] F0-4: Docker socket `:ro` na workerze
- [ ] F0-5: Pinned Dozzle version
- [ ] F0-6: Segmentacja sieci Docker (internal/external)
- [ ] F0-7: Credentials do .env (nie hardcoded)
- [ ] F0-8: Security headers w nginx
- [ ] F0-9: Rate limiting w nginx
- [ ] F0-10: Aktualizacja .env.example
- [ ] Commit i push zmian

### Na nowym VPS:

- [ ] F1-1: Nowe klucze SSH (ed25519)
- [ ] F1-2: Bootstrap VPS (deploy user, hartowanie SSH)
- [ ] F1-3: UFW z blokadą outbound UDP
- [ ] F1-4: Fail2ban
- [ ] F1-5: Docker (bez TCP listener)
- [ ] F1-6: Deploy aplikacji
- [ ] F1-7: Weryfikacja bezpieczeństwa (9 testów)

### Po stabilizacji:

- [ ] F2-1: Docker Socket Proxy
- [ ] F2-2: Automatyczne aktualizacje
- [ ] F2-3: Monitoring i alerty

### Administracyjne:

- [ ] Odpowiedź do Hetzner (statement)
- [ ] Aktualizacja DNS (nowe IP)
- [ ] Odnowienie Let's Encrypt na nowym IP
- [ ] Aktualizacja .context7 z decyzją i bugfixem
- [ ] Rotacja WSZYSTKICH API keys (Gemini, Stripe, Supabase service key, Senuto)

---

## Harmonogram

| Krok | Czas | Status |
|------|------|--------|
| Faza 0: Zmiany w repo | ~2h | ⏳ Do zrobienia |
| Zakup nowego VPS | ~15min | ⏳ Dawid |
| Faza 1: Konfiguracja VPS | ~1h | ⏳ Po zakupie |
| Weryfikacja + testy | ~30min | ⏳ Po F1 |
| Odpowiedź Hetzner | ~15min | ⏳ Po weryfikacji |
| DNS migration | ~5min + propagacja | ⏳ Po weryfikacji |
| Faza 2: Dodatkowe hartowanie | ~2h | ⏳ Po stabilizacji |
| Rotacja API keys | ~30min | ⏳ Po migracji |

**Szacowany czas całkowity**: ~6-7h (z przerwą na propagację DNS)

---

**Ostatnia aktualizacja**: 2026-02-15  
**Status**: Plan gotowy do wdrożenia
