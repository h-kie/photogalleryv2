# This Is a Cry for Help

A small, static photography gallery about isolation, difficult days, and the distance between needing help and asking for it. It uses plain HTML, CSS, vanilla JavaScript, and a JSON manifest; there is no build step or framework.

**Live gallery:** [h-kie.github.io/thisisacryforhelp](https://h-kie.github.io/thisisacryforhelp/)

## Pages and files

- `index.html` is the nearly empty entry page.
- `home.html` is the photograph gallery.
- `collections.html` lists collection names.
- `collections/untitled_01.html` is the first direct collection page.
- `data/gallery.json` defines the site identifier, contact destination, collections, and ordered photographs.
- `script.js` contains the shared gallery, loading, sound, navigation, and viewer behavior.
- `styles.css` contains the responsive archive styling.
- `assets/photos/` still contains the six original `sample-*.jpg` files. They are retained, but are not shown in the archive.

The six JPEGs are Unsplash samples, not photographs from the site owner, so the live configuration starts with an intentionally empty collection. Add your own photographs before expecting images on the gallery pages.

## Add photographs

Copy image files into `assets/photos/` (or a subfolder there), then add entries to the collection's `images` array in `data/gallery.json`. Paths are relative to the repository root, without a leading slash. Use exact filename casing and simple names such as `photo-01.jpg`.

```json
{
	"id": "photo-01",
	"src": "assets/photos/photo-01.jpg",
	"alt": "Describe the visible photograph",
	"width": 1600,
	"height": 1100,
	"layout": "wide",
	"number": "01",
	"caption": "Optional caption",
	"date": "2024",
	"location": "Optional location"
}
```

The array order is the display order. `alt`, `width`, and `height` should match the image; `caption`, `date`, `location`, and `number` are optional. Use `layout: "wide"` for an occasional two-column image. The default `src` is used in the viewer too. If you later make a smaller gallery copy and a full-size original, set `src` to the smaller file and add `largeSrc` for the original, for example `photo-01-small.jpg` and `photo-01.jpg`. No image-processing step is required.

If a file is missing, its space remains in the layout with a `file not found` message, and the full resolved path is logged to the browser console.

## Add a collection

Add a collection object to `collections` in `data/gallery.json`, with a unique `id`, visible `title`, root-relative `path`, and ordered `images` array. Copy `collections/untitled_01.html` to a new file at that path, then change its `data-collection-id` to the matching ID. Keep the nested page's `data-site-root="../"` and `data-landing="../index.html"`. The collection index is rendered from the JSON, so its name and link appear automatically. A photograph may be listed in more than one collection.

## Contact and entry behavior

Replace `mailto:replace-me@example.com` in `data/gallery.json` with your email destination or another link. The contact link appears at the bottom of the homepage, collection index, and collection pages; the landing page remains empty.

Clicking `start` records entry in the current browser tab using `sessionStorage` and opens `home.html`. A collection page opened directly in a fresh tab redirects to `index.html`; after entering through `start`, normal collection navigation works. The marker is per-tab, and the image viewer is never restored after a page refresh. Ordinary page links use normal browser navigation, so back and forward continue to work.

Sound starts off and is generated locally by the browser only after the visitor enables it. Its setting is kept only for the current tab session. No audio or other external service is used.

## Preview locally

From the repository directory, run:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/> in a browser, then click `start`. Use an HTTP server rather than opening the HTML file directly so the browser can fetch `data/gallery.json`.

## Publish with GitHub Pages

Commit and push the files to the existing `main` branch. In the repository's **Settings → Pages**, keep **Deploy from a branch** selected, choose `main` and the repository root (`/`), and save. Wait for the Pages deployment to finish. The URLs and image paths are built relative to the project directory, so the pages also work at `https://h-kie.github.io/thisisacryforhelp/`.

The current repository's six sample image URLs were checked locally and on the live site. The first four loaded successfully; the last two were still deferred by the browser's lazy-loading behavior when inspected, so no broken source path could be reproduced. The redesign adds explicit failure cards and root-aware paths for nested pages.

## Accessibility and performance

Photographs use descriptive alt text and keyboard-operable buttons. The viewer supports Escape, arrow keys, focus return, edge stopping, and touch swipes. It does not add a history entry. Only the first three photographs are waited on during the short loading sequence; later images are lazy-loaded. Motion respects `prefers-reduced-motion`, and sound is optional and off by default.