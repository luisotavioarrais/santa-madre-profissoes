# Fotografia + IA — Santa Madre (experimento)

Esta branch prepara um modo foto com o **FASHN VTON v1.5**, de licença Apache-2.0.
O modelo só funciona com um servidor GPU configurado: **o APK não executa a inferência localmente**.

## Instalação do servidor

1. Crie um ambiente privado com GPU NVIDIA compatível com PyTorch/CUDA.
2. Clone https://github.com/fashn-AI/fashn-vton-1.5 e siga as instruções oficiais para instalar e baixar pesos (~2 GB).
3. Gere quatro imagens de produto (flat-lay), autorizadas, em PNG e salve em `photo-ai/garments/escritor.png`, `advogado.png`, `medico.png`, `empresario.png`.
4. Instale as dependências deste diretório e configure `VTON_WEIGHTS_DIR` e `SANTA_MADRE_API_KEY`.
5. Inicie o servidor privado via `uvicorn server:app --host 127.0.0.1 --port 8000` (use um proxy HTTPS com autenticação).
6. Configure a URL do servidor no aplicativo. **Nunca distribua segredos no APK público.** Implemente autenticação por sessão no proxy para uso externo.

## Privacidade

O aplicativo não deve enviar fotos de crianças sem autorização dos responsáveis.
A API processa dados na memória e não grava fotos. Hospedagem/proxy e monitoramento devem também desabilitar registro de corpos de requisição e armazenamento de imagens.
Fotos podem passar pela memória/GPU do servidor durante o processamento.
Nunca use uma API pública de demonstração com fotos de estudantes.

## Limitações

Sem GPU, imagens de uniforme e URL privada, o modo foto AI não produzirá resultado.
Os arquivos 3D anteriores estão preservados na branch `main` como fallback separado.
