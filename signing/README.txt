QuantDinger Android release signing (tracked for your GitHub backup)

Files:
  quantdinger-release.jks  — PKCS12 keystore (alias: quantdinger)
  keystore.properties       — storePassword / keyPassword / keyAlias / storeFile

Security:
  - Anyone with this repo can sign APKs with your package name. Use a PRIVATE
    GitHub repo, or remove this folder from git and use CI secrets instead.
  - If this folder is ever leaked, rotate keys and Play App Signing as applicable.

Build:
  Gradle reads ../signing from android/ (see android/app/build.gradle).
