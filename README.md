# OKR Tree Software Frontend

A comprehensive OKR (Objectives and Key Results) tree management application built with Next.js, Tailwind CSS, and Shadcn UI.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- User Authentication (Login/Register)
- OKR Tree Visualization
- Objective Management (Create, Update, Delete)
- Task Management (Create, Update, Delete)
- User Task Dashboard
- Account Management

## Publishing as a Microsoft Teams Plugin

### Prerequisites

1. A Microsoft 365 developer account
2. App Studio installed in Microsoft Teams
3. Your application deployed to a publicly accessible HTTPS endpoint

### Steps to Publish for Free

1. **Update the manifest.json file**:
   - Replace `{{PLUGIN_ID}}` with a unique GUID (generate one at https://www.guidgen.com)
   - Replace `{{WEBSITE_URL}}` with your deployed application URL (without https://)
   - Update other placeholders as needed

2. **Create icons**:
   - Create `color.png` (192x192 pixels)
   - Create `outline.png` (32x32 pixels)

3. **Package your app**:
   - Zip the following files together:
     - manifest.json
     - color.png
     - outline.png

4. **Upload to Microsoft Teams**:
   - Open Microsoft Teams
   - Go to Apps > Manage your apps > Upload an app
   - Select "Upload a custom app"
   - Choose your zip file

5. **For organization-wide deployment**:
   - Submit your app to your organization's app catalog
   - This requires admin approval but is free

### Development Testing

For testing during development:
1. Use ngrok to create a tunnel to your local server:
   ```bash
   ngrok http 3000
   ```
2. Update the manifest.json with the ngrok URL
3. Package and upload to Teams as described above

### Free Publishing Options

1. **Side-loading**: Distribute the zip package directly to users (up to 500 users)
2. **Org App Catalog**: Free for internal distribution within your organization
3. **Developer Portal**: Use the Teams Developer Portal for easier management

For more information, visit [Microsoft Teams Platform Documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/)
