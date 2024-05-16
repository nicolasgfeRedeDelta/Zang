## ZAPPFY

### 📋 Pré-requisitos
 - Node(Dev: v14.21.2)
 - Postgresql
 - Redis

## 🔧 Instalação

* **[Node:](https://nodejs.org/en)**
* **[Postgresql:](https://www.postgresql.org/download/)**
* **[Redis:](https://redis.io/docs/getting-started/installation/install-redis-on-windows/)**

#### Instalar o Redis: 
Adicionar Wsl maquina para rodar serviço linux 
O WSL permite que você instale múltiplas distribuições Linux na sua máquina...

No PowerShell(como administrador):
> wsl --install (Baixar a versão Ubuntu)

Instalar Redis no Wsl
No wsl-Ubuntu: 
> sudo apt-get update (Atualiza o linux)<br/>
> sudo apt-get install redis (Instala o redis)

Iniciar o serviço do redis
> sudo service redis-server start<br/>
> redis-cli <br/>
> ping (se responder com PONG o serviço está iniciado)