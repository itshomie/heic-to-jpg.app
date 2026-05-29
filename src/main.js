import './styles.css';
import {
  Archive,
  CheckCircle2,
  Download,
  FlaskConical,
  FolderOpen,
  Image,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  XCircle,
  Zap,
  createIcons,
} from 'lucide';

const icons = {
  Archive,
  CheckCircle2,
  Download,
  FlaskConical,
  FolderOpen,
  Image,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  XCircle,
  Zap,
};

const formatConfig = {
  jpg: {
    label: 'JPG',
    extension: 'jpg',
    mime: 'image/jpeg',
    supportsQuality: true,
    qualityLabel: '3. JPG quality',
    hint: 'JPG is recommended for forms, email, marketplaces, and the broadest compatibility.',
    zipName: 'heic-to-jpg-images.zip',
  },
  png: {
    label: 'PNG',
    extension: 'png',
    mime: 'image/png',
    supportsQuality: false,
    qualityLabel: '3. PNG output',
    hint: 'PNG is lossless and useful for editing, but files are often larger than JPG.',
    zipName: 'heic-to-png-images.zip',
  },
  pdf: {
    label: 'PDF',
    extension: 'pdf',
    mime: 'application/pdf',
    supportsQuality: true,
    qualityLabel: '3. PDF image quality',
    hint: 'PDF exports one image per PDF file, useful for document uploads and sharing.',
    zipName: 'heic-to-pdf-files.zip',
  },
};

createIcons({ icons });
initEmailLinks();

const converterRoot = document.querySelector('.converter-shell');

if (converterRoot) {
  initConverter();
}

function initEmailLinks() {
  document.querySelectorAll('[data-email-user][data-email-domain][data-email-tld]').forEach((link) => {
    const email = `${link.dataset.emailUser}@${link.dataset.emailDomain}.${link.dataset.emailTld}`;
    link.textContent = email;
    link.setAttribute('href', `mailto:${email}`);
    link.setAttribute('aria-label', `Email ${email}`);
  });
}

function initConverter() {
  const state = {
    quality: 0.9,
    outputFormat: 'jpg',
    items: [],
  };

  let heicConverterPromise;
  let zipPromise;
  let pdfPromise;

  const elements = {
    fileInput: document.querySelector('#fileInput'),
    heroChoose: document.querySelector('#heroChoose'),
    dropZone: document.querySelector('#dropZone'),
    trySample: document.querySelector('#trySample'),
    formatSelect: document.querySelector('#formatSelect'),
    qualityRange: document.querySelector('#qualityRange'),
    qualityValue: document.querySelector('#qualityValue'),
    qualityLabel: document.querySelector('#qualityLabel'),
    rangeLabels: document.querySelector('#rangeLabels'),
    formatHint: document.querySelector('#formatHint'),
    resultsBody: document.querySelector('#resultsBody'),
    statusSummary: document.querySelector('#statusSummary'),
    convertedCount: document.querySelector('#convertedCount'),
    downloadZip: document.querySelector('#downloadZip'),
    clearFiles: document.querySelector('#clearFiles'),
    reconvertFiles: document.querySelector('#reconvertFiles'),
  };

  const sampleNames = ['IMG_1234.HEIC', 'IMG_1235.HEIC', 'IMG_1236.HEIC', 'IMG_1237.HEIC'];
  const samplePalettes = [
    ['#4f9fd9', '#cfeef6', '#1f6f54'],
    ['#d5965b', '#e9d4ad', '#34524e'],
    ['#f0b65f', '#e9e4d8', '#366b95'],
    ['#2fa36b', '#91d3d6', '#184f73'],
  ];

  updateFormatUi();

  elements.heroChoose.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', (event) => {
    addFiles(Array.from(event.target.files || []));
    elements.fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove('is-dragging');
    });
  });

  elements.dropZone.addEventListener('drop', (event) => {
    addFiles(Array.from(event.dataTransfer?.files || []));
  });

  elements.formatSelect.addEventListener('change', handleFormatChange);
  elements.qualityRange.addEventListener('input', (event) => {
    const value = Number(event.target.value);
    state.quality = value / 100;
    elements.qualityValue.textContent = `${value}%`;
  });

  elements.downloadZip.addEventListener('click', downloadZip);
  elements.clearFiles.addEventListener('click', clearFiles);
  elements.reconvertFiles.addEventListener('click', reconvertFiles);
  elements.trySample.addEventListener('click', loadSampleRows);

  function addFiles(files) {
    const validFiles = files.filter(isHeicFile);
    const invalidCount = files.length - validFiles.length;

    if (!validFiles.length) {
      if (invalidCount) {
        announceStatus('Choose .heic or .heif files to convert.');
      }
      return;
    }

    clearDemoItems();

    const newItems = validFiles.map((file) => createItem({
      source: 'file',
      file,
      originalName: file.name,
      originalSize: file.size,
    }));

    state.items.push(...newItems);
    renderResults();
    convertItems(newItems);

    if (invalidCount) {
      announceStatus(`${invalidCount} unsupported file${invalidCount > 1 ? 's were' : ' was'} skipped.`);
    }
  }

  function createItem({ source, file, originalName, originalSize }) {
    return {
      id: crypto.randomUUID(),
      source,
      file,
      originalName,
      outputName: toOutputName(originalName, state.outputFormat),
      outputFormat: state.outputFormat,
      originalSize,
      status: 'queued',
      resultBlob: null,
      resultUrl: '',
      previewUrl: '',
      resultSize: 0,
      error: '',
    };
  }

  function isHeicFile(file) {
    const name = file.name.toLowerCase();
    return name.endsWith('.heic') || name.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
  }

  async function handleFormatChange() {
    const previousFormat = state.outputFormat;
    state.outputFormat = elements.formatSelect.value;
    updateFormatUi();

    if (!state.items.length || previousFormat === state.outputFormat) {
      return;
    }

    if (state.items.every((item) => item.source === 'demo')) {
      await loadSampleRows();
      return;
    }

    const fileItems = state.items.filter((item) => item.source === 'file');
    fileItems.forEach(resetItemForCurrentFormat);
    renderResults();
    convertItems(fileItems);
  }

  function updateFormatUi() {
    const config = getFormatConfig();
    elements.qualityLabel.textContent = config.qualityLabel;
    elements.formatHint.textContent = config.hint;
    elements.qualityRange.hidden = !config.supportsQuality;
    elements.qualityValue.hidden = !config.supportsQuality;
    elements.rangeLabels.hidden = !config.supportsQuality;
    elements.qualityRange.disabled = !config.supportsQuality;

    if (config.supportsQuality) {
      elements.qualityValue.textContent = `${Math.round(state.quality * 100)}%`;
    }
  }

  function resetItemForCurrentFormat(item) {
    revokeItemUrl(item);
    item.outputFormat = state.outputFormat;
    item.outputName = toOutputName(item.originalName, state.outputFormat);
    item.status = 'queued';
    item.resultBlob = null;
    item.resultSize = 0;
    item.error = '';
  }

  async function convertItems(items) {
    for (const item of items) {
      item.status = 'converting';
      item.error = '';
      renderResults();

      try {
        const converted = await convertFileToOutput(item.file, item.outputFormat);

        revokeItemUrl(item);
        item.resultBlob = converted.resultBlob;
        item.resultUrl = URL.createObjectURL(converted.resultBlob);
        item.previewUrl =
          converted.previewBlob === converted.resultBlob ? item.resultUrl : URL.createObjectURL(converted.previewBlob);
        item.resultSize = converted.resultBlob.size;
        item.status = 'converted';
      } catch (error) {
        item.status = 'error';
        item.error = getErrorMessage(error);
      }

      renderResults();
    }
  }

  async function convertFileToOutput(file, outputFormat) {
    const { heicTo } = await getHeicConverter();
    const config = formatConfig[outputFormat];
    const imageType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
    const options = { blob: file, type: imageType };

    if (imageType === 'image/jpeg') {
      options.quality = state.quality;
    }

    const imageBlob = await heicTo(options);

    if (!(imageBlob instanceof Blob)) {
      throw new Error('The HEIC converter did not return an image file.');
    }

    if (outputFormat !== 'pdf') {
      return {
        resultBlob: imageBlob,
        previewBlob: imageBlob,
      };
    }

    return {
      resultBlob: await imageBlobToPdf(imageBlob),
      previewBlob: imageBlob,
      mime: config.mime,
    };
  }

  async function loadSampleRows() {
    clearFiles();

    const demoItems = await Promise.all(
      sampleNames.map(async (name, index) => {
        const converted = await createSampleOutput(samplePalettes[index], index);
        const item = createItem({
          source: 'demo',
          file: null,
          originalName: name,
          originalSize: [2400000, 1800000, 3200000, 2000000][index],
        });

        item.status = 'converted';
        item.resultBlob = converted.resultBlob;
        item.resultUrl = URL.createObjectURL(converted.resultBlob);
        item.previewUrl =
          converted.previewBlob === converted.resultBlob ? item.resultUrl : URL.createObjectURL(converted.previewBlob);
        item.resultSize = converted.resultBlob.size;
        return item;
      }),
    );

    state.items = demoItems;
    renderResults();
  }

  async function createSampleOutput(palette, index) {
    if (state.outputFormat === 'png') {
      const pngBlob = await createSampleImageBlob(palette, index, 'image/png');
      return {
        resultBlob: pngBlob,
        previewBlob: pngBlob,
      };
    }

    const jpegBlob = await createSampleImageBlob(palette, index, 'image/jpeg');

    if (state.outputFormat !== 'pdf') {
      return {
        resultBlob: jpegBlob,
        previewBlob: jpegBlob,
      };
    }

    return {
      resultBlob: await imageBlobToPdf(jpegBlob),
      previewBlob: jpegBlob,
    };
  }

  function clearDemoItems() {
    const hasOnlyDemo = state.items.length > 0 && state.items.every((item) => item.source === 'demo');
    if (hasOnlyDemo) {
      clearFiles();
    }
  }

  function reconvertFiles() {
    const fileItems = state.items.filter((item) => item.source === 'file');
    if (!fileItems.length) {
      announceStatus('Sample files are already converted. Add HEIC files to reconvert.');
      return;
    }

    fileItems.forEach(resetItemForCurrentFormat);
    renderResults();
    convertItems(fileItems);
  }

  function renderResults() {
    const config = getFormatConfig();
    if (!state.items.length) {
      elements.resultsBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="6">
            <span class="empty-state">
              <i data-lucide="image" aria-hidden="true"></i>
              Add HEIC files to convert them to ${config.label}.
            </span>
          </td>
        </tr>
      `;
      updateSummary();
      createIcons({ icons });
      return;
    }

    elements.resultsBody.innerHTML = state.items.map(renderRow).join('');
    elements.resultsBody.querySelectorAll('[data-download-id]').forEach((button) => {
      button.addEventListener('click', () => downloadItem(button.dataset.downloadId));
    });
    createIcons({ icons });
    updateSummary();
  }

  function renderRow(item) {
    const config = formatConfig[item.outputFormat] || getFormatConfig();
    const statusClass = `status ${item.status}`;
    const statusLabel = {
      queued: 'Queued',
      converting: 'Converting',
      converted: 'Converted',
      error: 'Error',
    }[item.status];
    const statusIcon =
      item.status === 'error' ? 'x-circle' : item.status === 'converted' ? 'check-circle-2' : 'loader-circle';
    const preview = item.previewUrl
      ? `<img src="${item.previewUrl}" alt="Converted ${config.label} preview for ${escapeHtml(item.originalName)}" />`
      : `<span class="pending-thumb"><i data-lucide="image" aria-hidden="true"></i></span>`;
    const resultText =
      item.status === 'converted'
        ? `<strong>${escapeHtml(item.outputName)}</strong><span>${formatBytes(item.resultSize)}</span>`
        : item.status === 'error'
          ? `<strong>Could not convert</strong><span>${escapeHtml(item.error)}</span>`
          : `<strong>Preparing ${config.label}</strong><span>Local conversion</span>`;
    const action =
      item.status === 'converted'
        ? `<button class="download-button" type="button" data-download-id="${item.id}">
            <i data-lucide="download" aria-hidden="true"></i>
            Download
          </button>`
        : `<button class="download-button" type="button" disabled>
            <i data-lucide="download" aria-hidden="true"></i>
            Download
          </button>`;

    return `
      <tr>
        <td data-label="Preview"><span class="preview-thumb">${preview}</span></td>
        <td data-label="Original file"><span class="file-name">${escapeHtml(item.originalName)}</span></td>
        <td data-label="Size">${formatBytes(item.originalSize)}</td>
        <td data-label="Status">
          <span class="${statusClass}">
            <i data-lucide="${statusIcon}" aria-hidden="true"></i>
            ${statusLabel}
          </span>
        </td>
        <td data-label="Result"><span class="result-name">${resultText}</span></td>
        <td data-label="Action">${action}</td>
      </tr>
    `;
  }

  function updateSummary() {
    const converted = state.items.filter((item) => item.status === 'converted').length;
    const converting = state.items.filter((item) => item.status === 'converting').length;
    const errors = state.items.filter((item) => item.status === 'error').length;
    const total = state.items.length;

    elements.convertedCount.textContent = `${converted} file${converted === 1 ? '' : 's'} converted`;
    elements.statusSummary.textContent = total
      ? `${converted}/${total} converted${converting ? `, ${converting} converting` : ''}${errors ? `, ${errors} failed` : ''}`
      : 'No files selected yet';

    const hasConverted = converted > 0;
    elements.downloadZip.disabled = !hasConverted;
    elements.clearFiles.disabled = total === 0;
    elements.reconvertFiles.disabled = !state.items.some((item) => item.source === 'file');
  }

  function downloadItem(id) {
    const item = state.items.find((entry) => entry.id === id);
    if (!item?.resultBlob) return;
    triggerDownload(item.resultBlob, item.outputName);
  }

  async function downloadZip() {
    const convertedItems = state.items.filter((item) => item.resultBlob);
    if (!convertedItems.length) return;

    elements.downloadZip.disabled = true;
    elements.downloadZip.innerHTML = '<i data-lucide="loader-circle" aria-hidden="true"></i> Preparing ZIP';
    createIcons({ icons });

    const JSZip = await getZip();
    const zip = new JSZip();
    convertedItems.forEach((item) => {
      zip.file(item.outputName, item.resultBlob);
    });

    const archive = await zip.generateAsync({ type: 'blob' });
    triggerDownload(archive, getFormatConfig().zipName);

    elements.downloadZip.innerHTML = '<i data-lucide="archive" aria-hidden="true"></i> Download all as ZIP';
    updateSummary();
    createIcons({ icons });
  }

  function clearFiles() {
    state.items.forEach(revokeItemUrl);
    state.items = [];
    renderResults();
  }

  function revokeItemUrl(item) {
    if (item.previewUrl && item.previewUrl !== item.resultUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }

    if (item.resultUrl) {
      URL.revokeObjectURL(item.resultUrl);
    }

    item.previewUrl = '';
    item.resultUrl = '';
  }

  function announceStatus(message) {
    elements.statusSummary.textContent = message;
  }

  function toOutputName(name, outputFormat) {
    const config = formatConfig[outputFormat] || formatConfig.jpg;
    const cleaned = name.replace(/\.(heic|heif)$/i, '');
    return `${cleaned || 'converted-image'}.${config.extension}`;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }

  function triggerDownload(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function getErrorMessage(error) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error) {
      return error.replace(/^Error:\s*/i, '');
    }

    if (error && typeof error === 'object') {
      if ('message' in error && error.message) {
        return String(error.message).replace(/^Error:\s*/i, '');
      }

      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    }

    return 'This browser could not read the HEIC file.';
  }

  async function getHeicConverter() {
    heicConverterPromise ??= import('heic-to');
    return heicConverterPromise;
  }

  async function getZip() {
    zipPromise ??= import('jszip').then((module) => module.default || module);
    return zipPromise;
  }

  async function getPdfConstructor() {
    pdfPromise ??= import('jspdf').then((module) => module.jsPDF);
    return pdfPromise;
  }

  function getFormatConfig() {
    return formatConfig[state.outputFormat] || formatConfig.jpg;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return entities[character];
    });
  }

  async function imageBlobToPdf(imageBlob) {
    const jsPDF = await getPdfConstructor();
    const dataUrl = await blobToDataUrl(imageBlob);
    const dimensions = await getImageDimensions(dataUrl);
    const maxPageSide = 1440;
    const scale = Math.min(1, maxPageSide / Math.max(dimensions.width, dimensions.height));
    const pageWidth = Math.round(dimensions.width * scale);
    const pageHeight = Math.round(dimensions.height * scale);
    const orientation = pageWidth >= pageHeight ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: [pageWidth, pageHeight],
      compress: true,
    });

    pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    return pdf.output('blob');
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result));
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsDataURL(blob);
    });
  }

  function getImageDimensions(src) {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      });
      image.addEventListener('error', reject);
      image.src = src;
    });
  }

  function createSampleImageBlob(palette, index, mimeType) {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 640;
    const context = canvas.getContext('2d');
    const [primary, secondary, dark] = palette;

    const sky = context.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, secondary);
    sky.addColorStop(1, '#ffffff');
    context.fillStyle = sky;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = primary;
    context.beginPath();
    context.moveTo(0, 430);
    context.bezierCurveTo(180, 320 + index * 16, 320, 470, 500, 355);
    context.bezierCurveTo(650, 260, 770, 390, 960, 300 + index * 24);
    context.lineTo(960, 640);
    context.lineTo(0, 640);
    context.closePath();
    context.fill();

    context.fillStyle = dark;
    context.globalAlpha = 0.82;
    context.beginPath();
    context.moveTo(0, 500);
    context.bezierCurveTo(220, 420, 380, 560, 560, 460);
    context.bezierCurveTo(720, 370, 840, 520, 960, 450);
    context.lineTo(960, 640);
    context.lineTo(0, 640);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 5; i += 1) {
      context.beginPath();
      context.arc(120 + i * 170, 150 + Math.sin(i + index) * 26, 38 + i * 4, 0, Math.PI * 2);
      context.fill();
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, state.quality);
    });
  }
}
