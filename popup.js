const translations = {
  en: {
    dir: "ltr",
    title: "Bookmark Organizer",
    folderLabel: "Select folder to organize:",
    dedupeLabel: "Remove duplicate URLs (ignore #hash)",
    loadingFolders: "Loading folders...",
    organizeBtn: "Organize Selected Folder",
    selectFolderAlert: "Please select a folder first!",
    organizingStatus: "Organizing & cleaning...",
    successStatus: (moved, removed) => {
      let msg = `Success! Moved ${moved} link(s).`;
      if (removed > 0) msg += ` Removed ${removed} duplicate(s).`;
      return msg;
    },
    untitledFolder: "Untitled Folder"
  },
  ar: {
    dir: "rtl",
    title: "تنظيم الـ Bookmarks",
    folderLabel: "اختر المجلد المراد تنظيمه:",
    dedupeLabel: "إزالة الروابط المكررة (تجاهل الـ #Hash)",
    loadingFolders: "جاري تحميل المجلدات...",
    organizeBtn: "تنظيم المجلد المحدد",
    selectFolderAlert: "يرجى اختيار مجلد أولاً!",
    organizingStatus: "جاري التنظيم والتنظيف...",
    successStatus: (moved, removed) => {
      let msg = `تم بنجاح! تم نقل ${moved} رابط.`;
      if (removed > 0) msg += ` وتطهير ${removed} رابط مكرر.`;
      return msg;
    },
    untitledFolder: "مجلد بدون اسم"
  }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. استرجاع الإعدادات المحفوظة (اللغة + وضع زر التبديل)
  const storedData = await chrome.storage.local.get(['appLang', 'removeDuplicates']);
  currentLang = storedData.appLang || 'en';

  const dedupeToggle = document.getElementById('dedupeToggle');
  if (storedData.removeDuplicates !== undefined) {
    dedupeToggle.checked = storedData.removeDuplicates;
  }

  const langSelect = document.getElementById('langSelect');
  langSelect.value = currentLang;

  applyLanguage(currentLang);
  await loadFolders();

  // 2. حفظ حالة زر التبديل عند التغيير
  dedupeToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ removeDuplicates: dedupeToggle.checked });
  });

  // 3. التبديل بين اللغات
  langSelect.addEventListener('change', async (e) => {
    currentLang = e.target.value;
    await chrome.storage.local.set({ appLang: currentLang });
    applyLanguage(currentLang);
    await loadFolders();
  });

  // 4. تنفيذ التنظيم
  document.getElementById('organizeBtn').addEventListener('click', async () => {
    const folderSelect = document.getElementById('folderSelect');
    const folderId = folderSelect.value;
    const shouldDedupe = dedupeToggle.checked;
    const statusDiv = document.getElementById('status');
    const t = translations[currentLang];

    if (!folderId) {
      alert(t.selectFolderAlert);
      return;
    }

    statusDiv.style.color = "#333";
    statusDiv.textContent = t.organizingStatus;

    const { movedCount, removedCount } = await organizeFolderByDomain(folderId, shouldDedupe);

    statusDiv.style.color = "#28a745";
    statusDiv.textContent = t.successStatus(movedCount, removedCount);

    await loadFolders();
  });
});

function applyLanguage(lang) {
  const t = translations[lang];
  document.body.dir = t.dir;
  document.getElementById('uiTitle').textContent = t.title;
  document.getElementById('uiFolderLabel').textContent = t.folderLabel;
  document.getElementById('uiDedupeLabel').textContent = t.dedupeLabel;
  document.getElementById('organizeBtn').textContent = t.organizeBtn;
}

// دالة لتنظيف وتوحيد الروابط وإزالة الـ Hash Anchor (#)
function normalizeUrl(urlStr) {
  try {
    const urlObj = new URL(urlStr);
    urlObj.hash = ''; // إزالة الجزء المترتب على #
    return urlObj.href;
  } catch (e) {
    return urlStr;
  }
}

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

// الوظيفة الرئيسية لتنظيم المجلد وإزالة التكرارات
async function organizeFolderByDomain(folderId, shouldDedupe) {
  const children = await chrome.bookmarks.getChildren(folderId);
  const domainFolders = {};
  const seenUrlsByDomain = {};

  // خريطة لتتبع المجلدات الفرعية والروابط الموجودة بداخلها مسبقاً
  for (const item of children) {
    if (!item.url) {
      domainFolders[item.title] = item.id;
      seenUrlsByDomain[item.title] = new Set();

      // جلب الروابط الموجودة داخل المجلد الفرعي مسبقاً لمنع التكرار معها
      if (shouldDedupe) {
        const subChildren = await chrome.bookmarks.getChildren(item.id);
        for (const subItem of subChildren) {
          if (subItem.url) {
            seenUrlsByDomain[item.title].add(normalizeUrl(subItem.url));
          }
        }
      }
    }
  }

  let movedCount = 0;
  let removedCount = 0;

  for (const item of children) {
    if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
      try {
        const urlObj = new URL(item.url);
        const domain = urlObj.hostname.replace(/^www\./, '');
        const cleanUrl = normalizeUrl(item.url);

        let destinationFolderId = domainFolders[domain];

        // إنشائ المجلد إن لم يكن موجوداً
        if (!destinationFolderId) {
          const newFolder = await chrome.bookmarks.create({
            parentId: folderId,
            title: domain
          });
          destinationFolderId = newFolder.id;
          domainFolders[domain] = destinationFolderId;
          seenUrlsByDomain[domain] = new Set();
        }

        // منطق فحص التكرارات
        if (shouldDedupe && seenUrlsByDomain[domain].has(cleanUrl)) {
          // حذف الرابط المكرر
          await chrome.bookmarks.remove(item.id);
          removedCount++;
        } else {
          // نقل الرابط وتسجيله كرابط تم العثور عليه
          await chrome.bookmarks.move(item.id, { parentId: destinationFolderId });
          seenUrlsByDomain[domain].add(cleanUrl);
          movedCount++;
        }

      } catch (error) {
        console.error("Error processing URL:", item.url, error);
      }
    }
  }

  return { movedCount, removedCount };
}
