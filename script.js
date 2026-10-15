(() => {
    const scriptElement = document.currentScript;
    const siteRoot = new URL(scriptElement?.dataset.siteRoot || './', document.baseURI);
    const page = document.body.dataset.page;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const storageKey = 'archive-entered-this-tab';

    if (page === 'collection') {
        let enteredFromStart = false;
        try {
            enteredFromStart = sessionStorage.getItem(storageKey) === 'yes';
        } catch {
            enteredFromStart = false;
        }

        if (!enteredFromStart) {
            window.location.replace(new URL(document.body.dataset.landing || 'index.html', document.baseURI));
            return;
        }
    }

    const body = document.body;
    const galleryPage = page === 'home' || page === 'collection';
    if (page !== 'landing') body.classList.add('is-loading');

    let leavingPage = false;
    let soundEnabled = false;
    try {
        soundEnabled = sessionStorage.getItem('archive-sound') === 'on';
    } catch {
        soundEnabled = false;
    }
    let audioContext;
    let galleryData;
    let currentPhotos = [];
    let activeIndex = 0;
    let lastTrigger;
    let touchOrigin;

    const photoGrid = document.querySelector('#photo-grid');
    const galleryStatus = document.querySelector('#gallery-status');
    const collectionList = document.querySelector('#collection-list');
    const viewer = document.querySelector('#image-viewer');
    const viewerImage = document.querySelector('#viewer-image');
    const viewerCount = document.querySelector('#viewer-count');
    const viewerDetails = document.querySelector('#viewer-details');
    const viewerEnd = document.querySelector('#viewer-end');
    const previousButton = document.querySelector('#viewer-previous');
    const nextButton = document.querySelector('#viewer-next');

    function siteUrl(path) {
        return new URL(path, siteRoot);
    }

    function finishLoading() {
        body.classList.add('gallery-visible', 'is-ready');
        window.setTimeout(() => body.classList.remove('is-loading'), reducedMotion ? 0 : 260);
    }

    function setStatus(message, isError = false) {
        if (!galleryStatus) return;
        galleryStatus.textContent = message;
        galleryStatus.hidden = false;
        if (isError) galleryStatus.setAttribute('role', 'alert');
    }

    function watchImage(image, timeout = 7000) {
        return new Promise((resolve) => {
            let timer;
            const done = () => {
                window.clearTimeout(timer);
                resolve();
            };
            image.addEventListener('load', done, { once: true });
            image.addEventListener('error', done, { once: true });
            timer = window.setTimeout(done, timeout);
        });
    }

    function createPhotoCard(photo, index) {
        const article = document.createElement('article');
        article.className = 'photo-card';
        article.style.setProperty('--item-index', index);
        article.dataset.layout = photo.layout === 'wide' || photo.layout === 2 ? 'wide' : 'normal';

        const button = document.createElement('button');
        button.className = 'photo-open';
        button.type = 'button';
        button.setAttribute('aria-label', `Open photograph: ${photo.alt || photo.id || `image ${index + 1}`}`);

        const image = document.createElement('img');
        image.className = 'gallery-image';
        image.alt = photo.alt || '';
        image.decoding = 'async';
        image.loading = index < 3 ? 'eager' : 'lazy';
        if (index === 0) image.fetchPriority = 'high';
        if (Number.isFinite(photo.width) && photo.width > 0) image.width = photo.width;
        if (Number.isFinite(photo.height) && photo.height > 0) image.height = photo.height;
        if (image.width && image.height) {
            button.style.setProperty('--photo-ratio', `${image.width} / ${image.height}`);
        }

        let settled = Promise.resolve();
        if (index < 3) settled = watchImage(image);
        const imageUrl = siteUrl(photo.src);
        image.addEventListener('error', () => {
            button.classList.add('is-missing');
            image.hidden = true;
            const error = document.createElement('span');
            error.className = 'photo-error';
            error.style.setProperty('--photo-ratio', image.width && image.height ? `${image.width} / ${image.height}` : '4 / 3');
            const identifier = document.createElement('span');
            identifier.textContent = photo.number || photo.id || `image ${index + 1}`;
            const message = document.createElement('span');
            message.textContent = 'file not found';
            error.append(identifier, message);
            button.append(error);
            console.error('Gallery image failed to load:', imageUrl.href);
        }, { once: true });
        image.src = imageUrl.href;

        button.append(image);
        button.addEventListener('click', () => openViewer(index, button));
        article.append(button);
        return { article, settled };
    }

    function renderPhotos(photos) {
        currentPhotos = photos;
        if (!photoGrid) return Promise.resolve();
        const cards = photos.map(createPhotoCard);
        photoGrid.replaceChildren(...cards.map((card) => card.article));

        if (photos.length === 0) {
            setStatus('no photographs configured');
            return Promise.resolve();
        }
        if (galleryStatus) galleryStatus.hidden = true;
        return Promise.all(cards.slice(0, 3).map((card) => card.settled));
    }

    function renderCollections() {
        if (!collectionList) return;
        const items = (galleryData.collections || []).map((collection) => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = siteUrl(collection.path).href;
            link.textContent = collection.title;
            item.append(link);
            return item;
        });
        collectionList.replaceChildren(...items);
        if (items.length === 0) setStatus('no collections configured');
    }

    function addViewerDetail(value) {
        if (!value) return;
        const detail = document.createElement('span');
        detail.textContent = value;
        viewerDetails.append(detail);
    }

    function updateViewer(index, immediate = false) {
        if (!viewer || !currentPhotos[index]) return;
        activeIndex = index;
        const photo = currentPhotos[index];
        const displayNumber = photo.number || String(index + 1).padStart(2, '0');
        viewerCount.textContent = `${displayNumber} / ${String(currentPhotos.length).padStart(2, '0')}`;
        viewerDetails.replaceChildren();
        [photo.caption, photo.date, photo.location].forEach(addViewerDetail);
        viewerEnd.hidden = index !== currentPhotos.length - 1;
        previousButton.disabled = index === 0;
        nextButton.disabled = index === currentPhotos.length - 1;
        viewerImage.alt = photo.alt || '';
        viewerImage.classList.remove('is-missing');

        const replaceImage = () => {
            viewerImage.onload = () => viewerImage.classList.remove('is-changing');
            viewerImage.onerror = () => {
                viewerImage.classList.remove('is-changing');
                viewerImage.classList.add('is-missing');
                console.error('Gallery image failed to load:', siteUrl(photo.largeSrc || photo.src).href);
                addViewerDetail('file not found');
            };
            viewerImage.src = siteUrl(photo.largeSrc || photo.src).href;
            if (viewerImage.complete && viewerImage.naturalWidth > 0) viewerImage.classList.remove('is-changing');
        };

        if (immediate || reducedMotion) {
            replaceImage();
        } else {
            viewerImage.classList.add('is-changing');
            window.setTimeout(replaceImage, 70);
        }
    }

    function playTick() {
        if (!soundEnabled) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            audioContext ||= new AudioContextClass();
            if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
            const length = Math.floor(audioContext.sampleRate * 0.025);
            const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
            const channel = buffer.getChannelData(0);
            for (let index = 0; index < length; index += 1) {
                channel[index] = (Math.random() * 2 - 1) * (1 - index / length);
            }
            const source = audioContext.createBufferSource();
            const filter = audioContext.createBiquadFilter();
            const gain = audioContext.createGain();
            source.buffer = buffer;
            filter.type = 'bandpass';
            filter.frequency.value = 1700;
            gain.gain.setValueAtTime(0.012, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.025);
            source.connect(filter).connect(gain).connect(audioContext.destination);
            source.start();
        } catch {}
    }

    function openViewer(index, trigger) {
        if (!viewer || !currentPhotos[index]) return;
        lastTrigger = trigger;
        updateViewer(index, true);
        viewer.showModal();
        document.querySelector('#viewer-close')?.focus();
        playTick();
    }

    function moveViewer(direction) {
        const nextIndex = activeIndex + direction;
        if (nextIndex < 0 || nextIndex >= currentPhotos.length) return;
        updateViewer(nextIndex);
        playTick();
    }

    document.querySelector('#viewer-close')?.addEventListener('click', () => viewer.close());
    previousButton?.addEventListener('click', () => moveViewer(-1));
    nextButton?.addEventListener('click', () => moveViewer(1));
    viewer?.addEventListener('close', () => {
        viewerImage.removeAttribute('src');
        viewerImage.classList.remove('is-changing', 'is-missing');
        if (lastTrigger?.isConnected) lastTrigger.focus();
    });
    viewer?.addEventListener('click', (event) => {
        if (event.target === viewer) viewer.close();
    });
    viewer?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            viewer.close();
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveViewer(-1);
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveViewer(1);
        }
    });
    viewerImage?.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch') touchOrigin = { x: event.clientX, y: event.clientY };
    });
    viewerImage?.addEventListener('pointerup', (event) => {
        if (!touchOrigin) return;
        const deltaX = event.clientX - touchOrigin.x;
        const deltaY = event.clientY - touchOrigin.y;
        touchOrigin = null;
        if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
            moveViewer(deltaX < 0 ? 1 : -1);
        }
    });
    viewerImage?.addEventListener('pointercancel', () => { touchOrigin = null; });

    document.querySelector('#sound-toggle')?.addEventListener('click', (event) => {
        soundEnabled = !soundEnabled;
        event.currentTarget.textContent = `sound: ${soundEnabled ? 'on' : 'off'}`;
        event.currentTarget.setAttribute('aria-pressed', String(soundEnabled));
        try {
            sessionStorage.setItem('archive-sound', soundEnabled ? 'on' : 'off');
        } catch {
            soundEnabled = false;
            event.currentTarget.textContent = 'sound: off';
            event.currentTarget.setAttribute('aria-pressed', 'false');
        }
        if (soundEnabled) playTick();
    });

    const soundToggle = document.querySelector('#sound-toggle');
    if (soundToggle) {
        soundToggle.textContent = `sound: ${soundEnabled ? 'on' : 'off'}`;
        soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    }

    document.querySelectorAll('#contact-link').forEach((link) => {
        link.href = galleryData?.contact || 'mailto:replace-me@example.com';
    });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target || link.hasAttribute('download')) return;
        const target = new URL(link.href, document.baseURI);
        if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return;
        if (leavingPage) {
            event.preventDefault();
            return;
        }
        if (link.classList.contains('start-link')) {
            try {
                sessionStorage.setItem(storageKey, 'yes');
            } catch {
                // Collection pages remain available when session storage is blocked.
            }
            link.classList.add('is-leaving');
        }
        event.preventDefault();
        leavingPage = true;
        body.classList.add('page-leaving');
        window.setTimeout(() => window.location.assign(target.href), reducedMotion ? 0 : 150);
    });

    async function loadGallery() {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(siteUrl('data/gallery.json'), { signal: controller.signal });
            if (!response.ok) throw new Error(`Gallery configuration returned ${response.status}`);
            galleryData = await response.json();
            if (!Array.isArray(galleryData.collections)) throw new Error('Gallery configuration has no collections array');
            document.querySelectorAll('.site-title').forEach((label) => {
                label.textContent = galleryData.siteTitle || 'this is a cry for help';
            });
            const pageLabel = page === 'collections'
                ? 'collections'
                : page === 'collection'
                    ? galleryData.collections.find((collection) => collection.id === body.dataset.collectionId)?.title || ''
                    : page === 'home' ? 'home' : '';
            document.querySelectorAll('.page-label').forEach((label) => {
                if (pageLabel) label.textContent = pageLabel;
            });
            document.title = [pageLabel, galleryData.siteTitle || 'this is a cry for help'].filter(Boolean).join(' / ');

            document.querySelectorAll('#contact-link').forEach((link) => {
                link.href = galleryData.contact || 'mailto:replace-me@example.com';
            });

            if (page === 'collections') {
                renderCollections();
            } else if (galleryPage) {
                let collection;
                if (page === 'home') {
                    const images = galleryData.collections.flatMap((item) => item.images || []);
                    await renderPhotos(images);
                } else {
                    collection = galleryData.collections.find((item) => item.id === body.dataset.collectionId);
                    if (!collection) {
                        setStatus('collection unavailable', true);
                    } else {
                        document.querySelector('#collection-id').textContent = collection.title;
                        await renderPhotos(collection.images || []);
                        const ending = document.querySelector('#collection-ending');
                        if (ending && collection.images?.length) ending.hidden = false;
                    }
                }
            }
        } catch (error) {
            console.error('Gallery configuration could not be loaded:', error);
            setStatus('configuration unavailable', true);
        } finally {
            window.clearTimeout(timeout);
            finishLoading();
        }
    }

    if (page !== 'landing') loadGallery();
})();
