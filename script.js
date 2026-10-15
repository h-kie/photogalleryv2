const galleryPath = new URL('./data/gallery.json', document.baseURI);
const photoGrid = document.querySelector('#photo-grid');
const projectList = document.querySelector('#project-list');
const imageCount = document.querySelector('#image-count');
const viewKicker = document.querySelector('#view-kicker');
const galleryHeading = document.querySelector('#gallery-heading');
const loadError = document.querySelector('#load-error');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxCount = document.querySelector('#lightbox-count');
const navigationButtons = [...document.querySelectorAll('[data-view]')];

let galleryData;
let visiblePhotos = [];
let activeIndex = 0;

function createPhotoCard(photo, index) {
    const article = document.createElement('article');
    article.className = 'photo-card';
    article.style.setProperty('--item-index', index);

    const button = document.createElement('button');
    button.className = 'photo-open';
    button.type = 'button';
    button.setAttribute('aria-label', `Open photograph: ${photo.title}`);
    button.style.setProperty('--photo-ratio', photo.ratio || '4 / 3');

    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.alt;
    image.width = photo.width;
    image.height = photo.height;
    image.loading = index < 2 ? 'eager' : 'lazy';
    image.decoding = 'async';
    button.append(image);
    button.addEventListener('click', () => openLightbox(index));

    const meta = document.createElement('div');
    meta.className = 'photo-meta';
    const title = document.createElement('span');
    title.className = 'photo-title';
    title.textContent = photo.title;
    const year = document.createElement('span');
    year.className = 'photo-year';
    year.textContent = photo.year || '';
    meta.append(title, year);

    article.append(button, meta);
    return article;
}

function renderPhotos(photos, heading, kicker) {
    visiblePhotos = photos;
    photoGrid.replaceChildren(...photos.map(createPhotoCard));
    projectList.hidden = true;
    photoGrid.hidden = false;
    galleryHeading.textContent = heading;
    viewKicker.textContent = kicker;
    imageCount.textContent = `${String(photos.length).padStart(2, '0')} photographs`;
}

function renderProjects() {
    photoGrid.hidden = true;
    projectList.hidden = false;
    galleryHeading.textContent = 'Curated projects';
    viewKicker.textContent = '02 / SMALLER WORLDS';
    imageCount.textContent = `${String(galleryData.projects.length).padStart(2, '0')} collections`;

    const cards = galleryData.projects.map((project, index) => {
        const photos = project.photoIds
            .map((id) => galleryData.photos.find((photo) => photo.id === id))
            .filter(Boolean);
        const card = document.createElement('button');
        card.className = 'project-card';
        card.type = 'button';
        card.setAttribute('aria-label', `Open project ${project.title}, ${photos.length} photographs`);

        const preview = document.createElement('img');
        preview.className = 'project-preview';
        preview.src = photos[0]?.src || '';
        preview.alt = '';
        preview.loading = 'lazy';
        preview.decoding = 'async';

        const details = document.createElement('span');
        const number = document.createElement('span');
        number.className = 'project-number';
        number.textContent = `PROJECT / ${String(index + 1).padStart(2, '0')}`;
        const title = document.createElement('span');
        title.className = 'project-title';
        title.textContent = project.title;
        const description = document.createElement('span');
        description.className = 'project-description';
        description.textContent = project.description;
        const total = document.createElement('span');
        total.className = 'project-total';
        total.textContent = `${String(photos.length).padStart(2, '0')} frames  ↗`;
        details.append(number, title, description, total);
        card.append(preview, details);
        card.addEventListener('click', () => {
            renderPhotos(photos, project.title, `PROJECT / ${String(index + 1).padStart(2, '0')}`);
        });
        return card;
    });

    projectList.replaceChildren(...cards);
}

function openLightbox(index) {
    activeIndex = index;
    updateLightbox();
    lightbox.showModal();
}

function updateLightbox() {
    const photo = visiblePhotos[activeIndex];
    if (!photo) return;
    lightboxImage.src = photo.largeSrc || photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = photo.caption || photo.title;
    lightboxCount.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(visiblePhotos.length).padStart(2, '0')}`;
}

function moveLightbox(direction) {
    activeIndex = (activeIndex + direction + visiblePhotos.length) % visiblePhotos.length;
    updateLightbox();
}

navigationButtons.forEach((button) => {
    button.addEventListener('click', () => {
        navigationButtons.forEach((item) => {
            item.classList.toggle('is-active', item === button);
            if (item === button) item.setAttribute('aria-current', 'page');
            else item.removeAttribute('aria-current');
        });
        if (button.dataset.view === 'projects') renderProjects();
        else renderPhotos(galleryData.photos, 'Selected images', '01 / FIELD NOTES');
    });
});

document.querySelector('#close-lightbox').addEventListener('click', () => lightbox.close());
document.querySelector('#previous-image').addEventListener('click', () => moveLightbox(-1));
document.querySelector('#next-image').addEventListener('click', () => moveLightbox(1));
document.querySelector('#lightbox-image-button').addEventListener('click', () => moveLightbox(1));

lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
});

document.addEventListener('keydown', (event) => {
    if (!lightbox.open) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        lightbox.close();
        return;
    }
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveLightbox(-1);
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveLightbox(1);
    }
});

document.querySelector('#current-year').textContent = new Date().getFullYear();

fetch(galleryPath)
    .then((response) => {
        if (!response.ok) throw new Error(`Gallery data returned ${response.status}`);
        return response.json();
    })
    .then((data) => {
        galleryData = data;
        renderPhotos(data.photos, 'Selected images', '01 / FIELD NOTES');
    })
    .catch((error) => {
        console.error(error);
        imageCount.textContent = 'Unavailable';
        loadError.hidden = false;
    });