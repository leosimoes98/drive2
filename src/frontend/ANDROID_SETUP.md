# Drive2 — Android com Capacitor

## Requisitos
- Node.js 18+
- Android Studio
- Android SDK instalado pelo Android Studio
- JDK compatível com a versão do Capacitor/Android Gradle Plugin

## Primeiro setup
No diretório `src/frontend`:

```bash
npm install
npx cap add android
npm run cap:sync
npx cap open android
```

Se preferir pnpm, use `pnpm install`.

## Gerar APK de teste
No Android Studio:
1. Abra `src/frontend/android`.
2. Aguarde o Gradle sincronizar.
3. Use **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. O APK de debug ficará normalmente em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Após alterar o site
```bash
npm run build
npx cap sync android
```
Depois gere o APK novamente pelo Android Studio.

## Importante
O ZIP original não continha o projeto Android. O diretório `android/` é criado pelo `npx cap add android` depois que as dependências do Capacitor são instaladas.
