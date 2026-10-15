# This Is a Cry for Help

A small, static photography gallery about isolation, difficult days, and the distance between needing help and asking for it. It uses plain HTML, CSS, vanilla JavaScript, and a JSON manifest; there is no build step or framework.

## Files

- `index.html` is the page structure.
- `styles.css` contains the responsive layout and visual styling.
- `script.js` renders the gallery, projects, and accessible photograph viewer.
- `data/gallery.json` contains photograph and curated-project metadata.
- `assets/photos/` contains the locally stored sample images.

## Replace the sample images

The six files in `assets/photos/` are labelled samples. Replace them with your own photographs, keeping the same filenames, or change the `src` and `largeSrc` values in `data/gallery.json`. Keep those paths relative, for example `./assets/photos/my-photo.jpg`.

Each photo entry supports `id`, `title`, `year`, `src`, `largeSrc`, `alt`, `caption`, `width`, `height`, and `ratio`. Use unique IDs, accurate alt text, and the image's actual pixel dimensions. To add a curated project, add an object to `projects` and list matching photo IDs in `photoIds`. Captions are optional; when omitted, the lightbox uses the title.

The sample JPEGs were downloaded from Unsplash and are provided as replaceable placeholders. Their filenames are explicitly marked `sample-`.

Replace `hello@example.com` in `index.html` with the address you want visitors to contact.

## Run locally

From the repository directory, start any static HTTP server. For example, with Python 3:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Serving over HTTP also allows the browser to fetch the JSON manifest; opening `index.html` directly as a `file://` URL may block that request.

## Publish with GitHub Pages

1. Commit and push the site files to your GitHub repository.
2. In the repository on GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose the branch containing the site (commonly `main`) and the repository root (`/`), then save.
5. Wait for the Pages deployment to finish. The site will appear at the URL GitHub shows on that settings page.

All site resources use relative paths. The manifest's `src` and `largeSrc` values resolve from the page URL, so this also works at a project URL such as `https://username.github.io/repository-name/`.

## Accessibility and performance

The image viewer uses a native dialog, labelled controls, Escape to close, and arrow keys to move between images. Gallery images below the first row are lazy-loaded. The page includes visible focus styles, descriptive alt text, responsive image sizing, and reduced-motion support.