# Gestión de Servicio Técnico - Bonet

Aplicación web estática en HTML, CSS y JavaScript para:

- Crear tickets de atención
- Gestionar actividades de servicio técnico
- Elaborar informes técnicos
- Generar prompts integrados con ChatGPT
- Publicar fácilmente en GitHub Pages

## Archivos

- `index.html`: estructura principal
- `style.css`: estilos
- `app.js`: lógica del sistema
- `README.md`: guía de despliegue

## Funcionalidades incluidas

- Panel de tickets
- Métricas rápidas
- Formulario de creación de tickets
- Módulo de informe técnico
- Generación de prompt IA
- Persistencia local con `localStorage`
- Exportación de informe en `.txt`

## Cómo publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube estos archivos a la raíz del repositorio.
3. Ve a **Settings**.
4. Entra a **Pages**.
5. En **Build and deployment**, selecciona:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/root`
6. Guarda.
7. Espera unos segundos y GitHub te dará la URL pública.

## Próxima versión recomendada

- Base de datos real
- Login de usuarios
- Roles: administrador, coordinador, técnico
- Adjuntar fotos y evidencias
- Exportación PDF
- Integración real con OpenAI API
- Historial por cliente y por equipo
