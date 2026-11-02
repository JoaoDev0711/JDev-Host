# JDev Host

Painel web pessoal para organizar servidores de jogos hospedados em um computador próprio.

## Estado atual

A primeira versão é um protótipo funcional de interface, feito em HTML, CSS e JavaScript puro. Não exige Node.js, banco de dados ou dependências.

- Dashboard responsivo.
- Cadastro local de servidores (os dados ficam apenas na sessão atual do navegador).
- Estados de iniciar/parar simulados.
- Console demonstrativo, sem execução de comandos.
- Estrutura visual preparada para receber telemetria do agente Linux.

> Importante: nesta etapa, o painel não inicia processos reais, não cria servidores e não executa comandos no host. Os estados e mensagens são demonstrações no navegador.

## Executar localmente

Abra o arquivo `index.html` no navegador. Para publicar, habilite GitHub Pages nas configurações do repositório e selecione a branch `main`, pasta `/(root)`.

## Arquitetura planejada

```
Navegador
   │ HTTPS
   ▼
Painel web (GitHub Pages)
   │ API autenticada / WebSocket seguro
   ▼
Backend de controle
   ▲
   │ conexão de saída autenticada (WSS/HTTPS)
   ▼
Agente Linux no computador host
   │
   └── runtime isolado dos servidores (ex.: containers)
```

O agente deve iniciar uma conexão de saída com o backend. Assim, o painel não precisa abrir uma porta administrativa de entrada no roteador do host. A conectividade pública dos jogadores aos servidores é uma configuração separada.

## Próximas etapas

1. Definir e implementar a API autenticada do backend.
2. Criar o agente Linux com registro seguro e reconexão.
3. Integrar status, uso de CPU/RAM/disco e logs reais.
4. Implementar criação e gerenciamento de instâncias isoladas, com limites de recursos.
5. Configurar acesso dos jogadores por solução adequada ao protocolo do jogo.

## Segurança

O agente não deve expor o socket do Docker, aceitar shell arbitrário nem executar comandos livres enviados pelo navegador. A implementação real deverá usar autenticação, TLS, permissões mínimas, templates permitidos e limites de recursos.

## Estrutura

```text
.
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── README.md
```

O HTML contém a estrutura da interface, o CSS concentra a apresentação visual e o JavaScript controla navegação, cadastros e biblioteca local de mods/plugins.
