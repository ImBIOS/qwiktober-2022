# Qwiktober 2022 ⚡️

[![Netlify Status](https://api.netlify.com/api/v1/badges/76ac0dc0-23c6-46b1-9374-edf61d6a4648/deploy-status)](https://app.netlify.com/sites/qwiktober2022/deploys)

[![CodeQL](https://github.com/ImBIOS/qwiktober-2022/actions/workflows/codeql.yml/badge.svg)](https://github.com/ImBIOS/qwiktober-2022/actions/workflows/codeql.yml)

🎯 The repository contains projects based on web development i.e easy to advance level projects so as to get started with web development and make your journey smooth in the field of web development.

🎯 This repository is open to all the members of the GitHub community. Feel free to contribute to this repository.

🎯 Do not forget to ⭐ the repository.

<br />

## 🏷️ Get Started

1. First, [fork the repository](https://github.com/ImBIOS/qwiktober-2022/fork).

2. Clone the forked repository to your local machine.

```bash
git clone https://github.com/{YOUR-USERNAME}/qwiktober-2022.git
```

3. Add upstream URL

4. Create a new branch

```bash
git checkout -b branch_name
```

5. Make your contribution to `public/websites` to add your own website to show-off

6. Commit and push the changes

```bash
git add .
git commit -m 'Relevant message'
git push origin branch_name
```

7. Create a new pull request from your forked repository (Click the `New Pull Request` button located at the top of your repo)

8. Wait for your PR review and approval from the maintainers.

   <br />

## 🧑‍💻 Customize Contributor Card

The `src/data/contributors.ts` file is responsible for custom contributor data. **Please don't edit others data if you don't want to get blocked by the maintainer!**

   <br />

## 🫗 Project Structure

Inside of you project, you'll see the following directories and files:

```
├── public/
│   └── ...
└── src/
    ├── components/
    │   └── ...
    └── routes/
        └── ...
```

- `src/routes`: Provides the directory based routing, which can include a hierarchy of `layout.tsx` layout files, and `index.tsx` files as the page. Additionally, `index.ts` files are endpoints. Please see the [routing docs](https://qwik.builder.io/qwikcity/routing/overview/) for more info.

- `src/components`: Recommended directory for components.

- `public`: Any static assets, like images, can be placed in the public directory. Please see the [Vite public directory](https://vitejs.dev/guide/assets.html#the-public-directory) for more info.

<br />

## ⚒️ Development

Development mode uses [Vite's development server](https://vitejs.dev/). For Qwik during development, the `dev` command will also server-side render (SSR) the output. The client-side development modules loaded by the browser.

```
npm run dev
```

> Note: during dev mode, Vite will request many JS files, which does not represent a Qwik production build.

### 🔨 Local development

The [Netlify CLI](https://docs.netlify.com/cli/get-started/) can be used to preview a production build locally. To do so: First build your site, then to start a local server, run:

1. install Netlify CLI globally `npm i -g netlify-cli`
2. Build your site both ssr and client `npm run build`.
3. Start a local server with `npm run serve`.
   In this project, `npm run serve` uses the `netlify dev` command to spin up a server that can handle Netlify's Edge Functions locally.
4. Visit [http://localhost:8888/](http://localhost:8888/) to check out your site.
