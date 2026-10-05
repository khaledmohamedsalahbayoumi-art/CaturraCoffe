// Storage and utilities for Academy PDF files
// Uses IndexedDB for large PDF storage to bypass localStorage 5MB quota safely

const DB_NAME = 'caturra_academy_db';
const STORE_NAME = 'pdf_files';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('Could not open IndexedDB for PDFs, fallback to in-memory');
      resolve(null);
    };
  });
}

export async function savePdfToStorage(id, pdfData) {
  if (!id || !pdfData) return false;
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, ...pdfData });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Error saving PDF to IndexedDB:', err);
    return false;
  }
}

export async function getPdfFromStorage(id) {
  if (!id) return null;
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Error reading PDF from IndexedDB:', err);
    return null;
  }
}

export async function deletePdfFromStorage(id) {
  if (!id) return false;
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Error deleting PDF from IndexedDB:', err);
    return false;
  }
}

export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'غير محدد';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export function createPdfBlobUrl(pdf) {
  if (!pdf) return null;
  if (pdf.url && !pdf.data) {
    return pdf.url;
  }
  if (!pdf.data) return null;

  try {
    const base64Data = pdf.data.includes(',') ? pdf.data.split(',')[1] : pdf.data;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Error creating PDF blob URL:', err);
    return null;
  }
}

export function openPdfInNewTab(pdf) {
  if (!pdf) return;
  if (pdf.url && !pdf.data) {
    window.open(pdf.url, '_blank', 'noopener,noreferrer');
    return;
  }
  const blobUrl = createPdfBlobUrl(pdf);
  if (blobUrl) {
    window.open(blobUrl, '_blank');
  } else if (pdf.url) {
    window.open(pdf.url, '_blank', 'noopener,noreferrer');
  } else {
    alert('تعذر فتح ملف الـ PDF. يرجى التأكد من صحة الملف.');
  }
}

export function downloadPdfFile(pdf) {
  if (!pdf) return;
  const fileName = pdf.name || 'caturra-academy-guide.pdf';
  let blobUrl = null;
  let shouldRevoke = false;

  if (pdf.data) {
    blobUrl = createPdfBlobUrl(pdf);
    shouldRevoke = true;
  } else if (pdf.url) {
    blobUrl = pdf.url;
  }

  if (!blobUrl) {
    alert('ملف الـ PDF غير متوفر للتحميل.');
    return;
  }

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (shouldRevoke) {
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  }
}
