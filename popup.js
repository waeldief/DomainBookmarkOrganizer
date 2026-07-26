// قاموس النصوص للغتين
const translations = {
  en: {
    dir: "ltr",
    title: "Bookmark Organizer",
    folderLabel: "Select folder to organize:",
    loadingFolders: "Loading folders...",
    organizeBtn: "Organize Selected Folder",
    selectFolderAlert: "Please select a folder first!",
    organizingStatus: "Organizing...",
    successStatus: (count) => `Success! Moved ${count} bookmark(s).`,
    untitledFolder: "Untitled Folder"
  },
  ar: {
    dir: "rtl",
    title: "تنظيم الـ Bookmarks",
    folderLabel: "اختر المجلد المراد تنظيمه:",
    loadingFolders: "جاري تحميل المجلدات...",
    organizeBtn: "تنظيم المجلد المحدد",
    selectFolderAlert: "يرجى اختيار مجلد أولاً!",
    organizingStatus: "جاري التنظيم...",
    successStatus: (count) => `تم بنجاح! تم نقل ${count} رابط.`,
    untitledFolder: "مجلد بدون اسم"
  }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. استرجاع اللغة المخزنة أو اعتماد الإنجليزية كافتراضية
  const storedData = await chrome.storage.local.get('appLang');
  currentLang = storedData.appLang || 'en';
  
  const langSelect = document.getElementById('langSelect');
  langSelect.value = currentLang;

  // 2. تطبيق النصوص والاتجاهات بناءً على اللغة
  applyLanguage(currentLang);
  await loadFolders();

  // 3. التبديل بين اللغات عند اختيار المستخدم
  langSelect.addEventListener('change', async (e) => {
    currentLang = e.target.value;
    await chrome.storage.local.set({ appLang: currentLang });
    applyLanguage(currentLang);
    await loadFolders(); // إعادة تحميل المجلدات بتسميات اللغة الجديدة
  });

  // 4. زر التنظيم
  document.getElementById('organizeBtn').addEventListener('click', async () => {
    const folderSelect = document.getElementById('folderSelect');
    const folderId = folderSelect.value;
    const statusDiv = document.getElementById('status');
    const t = translations[currentLang];

    if (!folderId) {
      alert(t.selectFolderAlert);
      return;
    }

    statusDiv.style.color = "#333";
    statusDiv.textContent = t.organizingStatus;

    const movedCount = await organizeFolderByDomain(folderId);

    statusDiv.style.color = "#28a745";
    statusDiv.textContent = t.successStatus(movedCount);

    await loadFolders();
  });
});

// تحديث الواجهة والاتجاه (RTL / LTR)
function applyLanguage(lang) {
  const t = translations[lang];
  document.body.dir = t.dir;
  document.getElementById('uiTitle').textContent = t.title;
  document.getElementById('uiFolderLabel').textContent = t.folderLabel;
  document.getElementById('organizeBtn').textContent = t.organizeBtn;
}

// تحميل المجلدات في القائمة
async function loadFolders() {
  const t = translations[currentLang];
  const tree = await chrome.bookmarks.getTree();
  const select = document.getElementById('folderSelect');
  select.innerHTML = '';

  function traverse(nodes, depth = 0) {
    for (const node of nodes) {
      if (!node.url && node.children) {
        if (node.id !== '0') {
          const option = document.createElement('option');
          option.value = node.id;
          const indent = '— '.repeat(depth > 0 ? depth - 1 : 0);
          option.textContent = `${indent}${node.title || t.untitledFolder}`;
          select.appendChild(option);
        }
        traverse(node.children, depth + 1);
      }
    }
  }

  traverse(tree);
}

// منطق التنظيم حسب الـ Domain
async function organizeFolderByDomain(folderId) {
  const children = await chrome.bookmarks.getChildren(folderId);
  const domainFolders = {};

  for (const item of children) {
    if (!item.url) {
      domainFolders[item.title] = item.id;
    }
  }

  let movedCount = 0;

  for (const item of children) {
    if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
      try {
        const urlObj = new URL(item.url);
        const domain = urlObj.hostname.replace(/^www\./, '');

        let destinationFolderId = domainFolders[domain];

        if (!destinationFolderId) {
          const newFolder = await chrome.bookmarks.create({
            parentId: folderId,
            title: domain
          });
          destinationFolderId = newFolder.id;
          domainFolders[domain] = destinationFolderId;
        }

        await chrome.bookmarks.move(item.id, { parentId: destinationFolderId });
        movedCount++;

      } catch (error) {
        console.error("Error organizing URL:", item.url, error);
      }
    }
  }

  return movedCount;
}
