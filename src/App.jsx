import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
}
 from 'firebase/firestore';
import {
  AlertCircle,
  Plus,
  Trash,
  CheckCircle,
  Shirt,
  RefreshCw, // REPLACED WashingMachine to prevent build error
  ArrowDownWideNarrow,
  CalendarDays,
  Tag,
  List,
  Grid,
  Settings,
  KeyRound, // CORRECTED from 'Key'
  Database,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Camera,
  UploadCloud,
  Link,
  Palette,
} from 'lucide-react';

// --- Firebase and Environment Configuration ---
// This line correctly reads the environment variable from your deployment server (Render/Vercel)
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase app.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Utility Functions ---

const getTimeSince = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
};

// --- Firestore Path Helper ---
const getItemCollectionPath = (authUid, sharedKey) => {
  if (sharedKey && sharedKey !== authUid) {
    return `artifacts/${appId}/public/data/laundry_sharing/${sharedKey}/items`;
  }
  return `artifacts/${appId}/users/${authUid}/laundry_items`;
};

const getCategoryCollectionPath = (authUid, sharedKey) => {
  if (sharedKey && sharedKey !== authUid) {
    return `artifacts/${appId}/public/data/laundry_sharing/${sharedKey}/categories`;
  }
  return `artifacts/${appId}/users/${authUid}/laundry_categories`;
};

// --- React Components ---

const LaundryItem = ({ item, onWear, onWash, onDelete }) => {
  const needsWashing = item.usageCount >= 3;
  const lastWashedDate = item.lastWashed?.toDate();
  const timeSinceWashed = getTimeSince(lastWashedDate);

  const getImageUrl = (item) => {
    if (item.imageUrl && item.imageUrl.trim() !== '' && !item.imageUrl.includes('Image+Too+Large')) return item.imageUrl;
    return `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'Item').substring(0, 3)}`;
  };

  return (
    <div className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${needsWashing ? 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} shadow-sm border`}>
      <div className="flex-1 flex items-center space-x-3 sm:space-x-4">
        {item.imageUrl && item.imageUrl.trim() !== '' && !item.imageUrl.includes('Image+Too+Large') ? (
          <img 
            src={getImageUrl(item)} 
            alt={item.name} 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover bg-slate-100 dark:bg-slate-700 p-1"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'I').substring(0, 3)}` }}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className={`p-2 rounded-full ${needsWashing ? 'bg-red-200 text-red-800' : 'bg-blue-100 text-blue-600'}`}>
            <Shirt size={18} className="sm:size-20" />
          </div>
        )}
        <div className="flex-1 space-y-0.5 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Worn: {item.usageCount} times</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-600 hidden sm:inline"></span>
            <div className="px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center">
              <Tag size={12} className="inline mr-0.5" /> {item.category || 'Uncategorized'}
            </div>
            <div className="flex items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto mt-0.5 sm:mt-0">
              <CalendarDays size={14} className="mr-1" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Last Washed: {timeSinceWashed}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 ml-2 flex-shrink-0">
        <button onClick={() => onWear(item)} className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors duration-200 transform hover:scale-105 shadow-md" aria-label={`Mark ${item.name} as worn`}>
          <Plus size={18} />
        </button>
        <button onClick={() => onWash(item)} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 transform hover:scale-105 shadow-md" aria-label={`Mark ${item.name} as washed`}>
          <RefreshCw size={18} />
        </button>
        <button onClick={() => onDelete(item)} className="p-2 bg-slate-300 text-slate-700 rounded-full hover:bg-slate-400 transition-colors duration-200 transform hover:scale-105 shadow-md" aria-label={`Delete ${item.name}`}>
          <Trash size={18} />
        </button>
      </div>
    </div>
  );
};

const WardrobeItem = ({ item, onWear, onWash, onDelete }) => {
  const needsWashing = item.usageCount >= 3;
  const timeSinceWashed = getTimeSince(item.lastWashed?.toDate());
  const imageUrl = item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'I').substring(0, 3)}`;

  return (
    <div className={`p-3 rounded-xl flex flex-col items-center text-center transition-all duration-300 ${needsWashing ? 'bg-red-50 dark:bg-red-900 border-red-300 dark:border-red-700 shadow-lg ring-2 ring-red-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md'} border`}>
      <div className="relative">
        <img src={imageUrl} alt={item.name} className="h-28 w-28 sm:h-32 sm:w-32 rounded-xl object-contain bg-white dark:bg-slate-700 p-1 border-2 border-slate-200 dark:border-slate-700" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'I').substring(0, 3)}` }} style={{ objectFit: 'contain' }} />
        {needsWashing && (
          <div className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full translate-x-1 -translate-y-1 shadow-lg" title="Needs Washing!">
            <AlertCircle size={14} />
          </div>
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2 truncate w-full px-1">{item.name}</h3>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
        <p className="font-medium">Worn: {item.usageCount}</p>
        <p className="italic">Washed: {timeSinceWashed}</p>
      </div>
      <div className="flex space-x-2 mt-3">
        <button onClick={() => onWear(item)} className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors duration-200 shadow-md" aria-label={`Mark ${item.name} as worn`}>
          <Plus size={16} />
        </button>
        <button onClick={() => onWash(item)} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-md" aria-label={`Mark ${item.name} as washed`}>
          <RefreshCw size={16} />
        </button>
        <button onClick={() => onDelete(item)} className="p-2 bg-slate-300 text-slate-700 rounded-full hover:bg-slate-400 transition-colors duration-200 shadow-md" aria-label={`Delete ${item.name}`}>
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};

const CategoryRow = ({ category, items, onWear, onWash, onDelete }) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3 pb-6">
      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
        <Tag size={20} className="mr-2 text-indigo-500" />
        {category} ({items.length})
      </h4>
      <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4 sm:px-0">
        {items.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-44 sm:w-48">
            <WardrobeItem item={item} onWear={onWear} onWash={onWash} onDelete={onDelete} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-sm border border-slate-300 dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
        <AlertCircle size={24} className="text-red-500 mr-2" /> Confirm Action
      </h3>
      <p className="text-slate-600 dark:text-slate-400">{message}</p>
      <div className="flex justify-end space-x-3">
        <button onClick={onCancel} className="p-3 rounded-xl bg-slate-300 text-slate-800 font-semibold hover:bg-slate-400 transition-colors shadow-md">Cancel</button>
        <button onClick={onConfirm} className="p-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-md">Delete</button>
      </div>
    </div>
  </div>
);

// --- Main App Component ---
const App = () => {
  const [laundryItems, setLaundryItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Shirts');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [sortBy, setSortBy] = useState('usage');
  const [authUid, setAuthUid] = useState(null);
  const [dataKey, setDataKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWardrobeView, setIsWardrobeView] = useState(true);
  const [showWashModal, setShowWashModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newWashDate, setNewWashDate] = useState('');
  const [sharedKeyInput, setSharedKeyInput] = useState('');
  const [appName, setAppName] = useState('Laundry Tracker');
  const [appCaption, setAppCaption] = useState('Track clothes usage to know when to wash them.');
  const [primaryBgColor, setPrimaryBgColor] = useState('#f1f5f9');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [displayCategoryOrder, setDisplayCategoryOrder] = useState([]);

  const availableFonts = [
    { name: 'Inter (Default)', style: 'Inter, sans-serif' }, { name: 'Roboto', style: 'Roboto, sans-serif' },
    { name: 'Open Sans', style: 'Open Sans, sans-serif' }, { name: 'Montserrat', style: 'Montserrat, sans-serif' },
    { name: 'Courier New', style: 'Courier New, monospace' },
  ];

  const defaultCategories = ['Shirts', 'Pants', 'Nightwear', 'Innerwear', 'Towels', 'Bedsheets', 'Handkerchiefs'];
  const allCategories = [...defaultCategories, ...customCategories].filter((v, i, a) => a.indexOf(v) === i);

  const saveCustomization = (newSettings) => {
    const currentSettings = { appName, appCaption, primaryBgColor, fontFamily };
    const mergedSettings = { ...currentSettings, ...newSettings };
    localStorage.setItem('appCustomization', JSON.stringify(mergedSettings));
    if (newSettings.appName !== undefined) setAppName(newSettings.appName);
    if (newSettings.appCaption !== undefined) setAppCaption(newSettings.appCaption);
    if (newSettings.primaryBgColor !== undefined) setPrimaryBgColor(newSettings.primaryBgColor);
    if (newSettings.fontFamily !== undefined) setFontFamily(newSettings.fontFamily);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result.length > 1024 * 1024) {
          setItemImageUrl(`https://placehold.co/150x50/ff0000/ffffff?text=Image+Too+Large`);
          console.error("Image too large. Max 1MB allowed for inline storage.");
          return;
        }
        setItemImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const storedKey = localStorage.getItem('sharedDataKey');
    if (storedKey) setSharedKeyInput(storedKey);
    const storedCustomization = localStorage.getItem('appCustomization');
    if (storedCustomization) {
      try {
        const custom = JSON.parse(storedCustomization);
        setAppName(custom.appName || 'Laundry Tracker');
        setAppCaption(custom.appCaption || 'Track clothes usage to know when to wash them.');
        setPrimaryBgColor(custom.primaryBgColor || '#f1f5f9');
        setFontFamily(custom.fontFamily || 'Inter, sans-serif');
      } catch (e) {
        console.error("Error parsing app customization from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    const storedOrder = JSON.parse(localStorage.getItem('categoryDisplayOrder'));
    const currentCategories = ['Uncategorized', ...allCategories];
    if (storedOrder && storedOrder.length > 0) {
      const mergedOrder = [
        ...storedOrder.filter(cat => currentCategories.includes(cat.name)),
        ...currentCategories.filter(cat => !storedOrder.map(o => o.name).includes(cat)).map(cat => ({ name: cat, visible: true }))
      ];
      setDisplayCategoryOrder(mergedOrder);
    } else if (allCategories.length > 0 && displayCategoryOrder.length === 0) {
      const initialOrder = currentCategories.map(cat => ({ name: cat, visible: true }));
      setDisplayCategoryOrder(initialOrder);
      localStorage.setItem('categoryDisplayOrder', JSON.stringify(initialOrder));
    }
  }, [allCategories.length, customCategories.length]);

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
        else await signInAnonymously(auth);
      } catch (error) {
        console.error('Firebase authentication failed:', error);
      }
    };
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUid(user.uid);
        const key = localStorage.getItem('sharedDataKey') || user.uid;
        setDataKey(key);
        setSharedKeyInput(key);
      } else {
        authenticate();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authUid || !dataKey) return;
    setLoading(true);
    const itemsPath = getItemCollectionPath(authUid, dataKey);
    const categoriesPath = getCategoryCollectionPath(authUid, dataKey);
    const qItems = query(collection(db, itemsPath));
    const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
      setLaundryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => { console.error('Error fetching items:', error); setLoading(false); });
    const qCategories = query(collection(db, categoriesPath));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      setCustomCategories(snapshot.docs.map(doc => doc.data().name));
    }, (error) => console.error('Error fetching categories:', error));
    return () => { unsubscribeItems(); unsubscribeCategories(); };
  }, [authUid, dataKey]);

  const setSharedKey = (e) => {
    e.preventDefault();
    const key = sharedKeyInput.trim();
    if (key.length < 4) return;
    localStorage.setItem('sharedDataKey', key);
    setDataKey(key);
    setShowSettingsModal(false);
  };

  const clearSharedKey = () => {
    localStorage.removeItem('sharedDataKey');
    setDataKey(authUid);
    setSharedKeyInput(authUid);
    setShowSettingsModal(false);
  };

  const sortedItems = [...laundryItems].sort((a, b) => {
    if (sortBy === 'date') return (b.lastWashed?.toDate() || 0) - (a.lastWashed?.toDate() || 0);
    if (sortBy === 'usage') return b.usageCount - a.usageCount;
    return (a.name || '').localeCompare(b.name || '');
  });

  const filteredItems = selectedCategoryFilter === 'All' ? sortedItems : sortedItems.filter(item => (item.category || 'Uncategorized') === selectedCategoryFilter);

  const addItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !authUid || !dataKey) return;
    try {
      await addDoc(collection(db, getItemCollectionPath(authUid, dataKey)), {
        name: itemName.trim(), usageCount: 0, category: selectedCategory,
        imageUrl: itemImageUrl.trim() || `https://placehold.co/150x150/e2e8f0/1a202c?text=${itemName.substring(0, 3)}`,
        lastWashed: serverTimestamp(), createdAt: serverTimestamp(),
      });
      setItemName(''); setItemImageUrl('');
    } catch (error) { console.error('Error adding item:', error); }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !authUid || !dataKey) return;
    try {
      await addDoc(collection(db, getCategoryCollectionPath(authUid, dataKey)), { name: newCategoryName.trim() });
      setNewCategoryName('');
    } catch (error) { console.error('Error adding category:', error); }
  };

  const wearItem = async (item) => {
    if (!authUid || !dataKey) return;
    try {
      await updateDoc(doc(db, getItemCollectionPath(authUid, dataKey), item.id), { usageCount: (item.usageCount || 0) + 1 });
    } catch (error) { console.error('Error updating item:', error); }
  };

  const openWashModal = (item) => {
    setSelectedItem(item);
    setNewWashDate(item.lastWashed?.toDate()?.toISOString().substring(0, 10) || new Date().toISOString().substring(0, 10));
    setShowWashModal(true);
  };

  const washItem = async () => {
    if (!authUid || !dataKey || !selectedItem || !newWashDate) return;
    try {
      await updateDoc(doc(db, getItemCollectionPath(authUid, dataKey), selectedItem.id), {
        usageCount: 0, lastWashed: Timestamp.fromDate(new Date(newWashDate)),
      });
      setShowWashModal(false); setSelectedItem(null);
    } catch (error) { console.error('Error washing item:', error); }
  };

  const openDeleteModal = (item) => { setSelectedItem(item); setShowDeleteModal(true); };

  const deleteItem = async () => {
    if (!authUid || !dataKey || !selectedItem) return;
    try {
      await deleteDoc(doc(db, getItemCollectionPath(authUid, dataKey), selectedItem.id));
      setShowDeleteModal(false); setSelectedItem(null);
    } catch (error) { console.error('Error deleting item:', error); }
  };

  const saveCategoryOrder = (newOrder) => {
    setDisplayCategoryOrder(newOrder);
    localStorage.setItem('categoryDisplayOrder', JSON.stringify(newOrder));
  };

  const moveCategory = (index, direction) => {
    const newOrder = [...displayCategoryOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      saveCategoryOrder(newOrder);
    }
  };

  const toggleCategoryVisibility = (index) => {
    const newOrder = [...displayCategoryOrder];
    newOrder[index].visible = !newOrder[index].visible;
    saveCategoryOrder(newOrder);
  };

  const itemsByCategory = sortedItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
  const categoriesToDisplay = displayCategoryOrder.filter(order => order.visible && (itemsByCategory[order.name] || []).length > 0);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 flex flex-col items-center transition-colors duration-500" style={{ backgroundColor: primaryBgColor, fontFamily: fontFamily }}>
      <div className="w-full max-w-2xl bg-slate-200 dark:bg-slate-800 p-4 sm:p-6 rounded-3xl shadow-2xl space-y-6 sm:space-y-8 border-slate-300 dark:border-slate-700 border">
        
        <header className="text-center space-y-1 sm:space-y-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-800 dark:text-slate-100">{appName}</h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400">{appCaption}</p>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p className="flex items-center justify-center space-x-2">
              <Database size={16} />
              <span className="font-semibold text-slate-800 dark:text-slate-100">Data Key:</span>
              <span className={`font-mono text-xs p-1 rounded-md ${dataKey && dataKey !== authUid ? 'bg-indigo-500 text-white' : 'bg-slate-300 dark:bg-slate-700'} break-all`}>{dataKey || 'Loading...'}</span>
            </p>
          </div>
        </header>

        <div className="flex justify-between space-x-2">
          <button onClick={() => setShowSettingsModal(true)} className="p-3 rounded-full bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300 transition-colors duration-200 hover:bg-slate-400 dark:hover:bg-slate-600 shadow-md" aria-label="Settings">
            <Settings size={20} />
          </button>
          <div className="flex space-x-2">
            <button onClick={() => setIsWardrobeView(false)} className={`p-3 rounded-full transition-colors duration-200 shadow-md ${!isWardrobeView ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`} aria-label="List view">
              <List size={20} />
            </button>
            <button onClick={() => setIsWardrobeView(true)} className={`p-3 rounded-full transition-colors duration-200 shadow-md ${isWardrobeView ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`} aria-label="Grid view">
              <Grid size={20} />
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto space-x-3 pb-2 pt-1 border-b border-slate-300 dark:border-slate-700 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button onClick={() => setSelectedCategoryFilter('All')} className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-colors duration-200 shadow-md text-sm ${selectedCategoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
            All Items ({laundryItems.length})
          </button>
          {allCategories.map(cat => {
            const count = sortedItems.filter(item => (item.category || 'Uncategorized') === cat).length;
            if (count === 0) return null;
            return (
              <button key={cat} onClick={() => setSelectedCategoryFilter(cat)} className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-colors duration-200 shadow-md text-sm ${selectedCategoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                {cat} ({count})
              </button>
            );
          })}
        </div>
        
        {!isWardrobeView ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-300 dark:bg-slate-700 shadow-inner">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-300 font-semibold">
              <ArrowDownWideNarrow size={18} />
              <span>Sort by:</span>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="usage">Usage Count</option>
              <option value="date">Last Washed</option>
            </select>
          </div>
        ) : (
          <form onSubmit={addItem} className="flex flex-col space-y-4 p-4 bg-white dark:bg-slate-700 rounded-xl shadow-inner border border-slate-300 dark:border-slate-600">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add New Item</h4>
            <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item Name" className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border" />
            <div className='space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-400 dark:border-slate-600'>
              <div className='flex justify-between items-center'>
                <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>Image (Max 1MB)</p>
                {itemImageUrl && <button type="button" onClick={() => setItemImageUrl('')} className="text-xs text-red-500 hover:text-red-700"><X size={14} /> Remove</button>}
              </div>
              <div className='grid grid-cols-3 gap-3'>
                <label className="cursor-pointer"><input type="file" accept="image/*" capture="camera" className="hidden" onChange={handleImageUpload} /><div className="p-3 rounded-xl text-center bg-indigo-200 text-indigo-800 h-full flex flex-col items-center justify-center"><Camera size={20} /><span className="text-xs mt-1">Take Photo</span></div></label>
                <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /><div className="p-3 rounded-xl text-center bg-green-200 text-green-800 h-full flex flex-col items-center justify-center"><UploadCloud size={20} /><span className="text-xs mt-1">Upload</span></div></label>
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-700 p-2 rounded-xl border"><Link size={20} className="text-slate-500" /><input type="text" value={itemImageUrl} onChange={(e) => setItemImageUrl(e.target.value)} placeholder="Paste URL" className="w-full bg-transparent text-sm" /></div>
              </div>
              {itemImageUrl && !itemImageUrl.includes('Image+Too+Large') && <div className="mt-2 flex justify-center"><img src={itemImageUrl} alt="Preview" className="max-h-24 rounded-lg" /></div>}
              {itemImageUrl.includes('Image+Too+Large') && <p className="text-center text-red-500 text-sm">Image is too large.</p>}
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border"><option disabled>Select Category</option>{allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
            <button type="submit" disabled={!itemName.trim()} className={`p-3 rounded-xl font-semibold ${itemName.trim() ? 'bg-indigo-600 text-white' : 'bg-slate-400 cursor-not-allowed'}`}>Add Item</button>
          </form>
        )}

        {loading ? <div className="text-center p-8"><RefreshCw size={48} className="mx-auto animate-spin" /><p>Loading...</p></div>
          : filteredItems.length === 0 ? <div className="text-center p-8 bg-slate-100 dark:bg-slate-700 rounded-xl"><AlertCircle size={48} className="mx-auto text-yellow-500" /><p className="mt-4 font-bold">No items found!</p><p>No items in the **{selectedCategoryFilter}** category.</p></div>
          : <div className="space-y-4">
              {dataKey !== authUid && <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl text-sm text-center"><KeyRound size={16} className="inline mr-2" />Viewing shared wardrobe: <b>{dataKey}</b></div>}
              {isWardrobeView && selectedCategoryFilter === 'All' ? (
                <div className="space-y-6">
                  {categoriesToDisplay.map(cat => <CategoryRow key={cat.name} category={cat.name} items={itemsByCategory[cat.name]} onWear={wearItem} onWash={openWashModal} onDelete={openDeleteModal} />)}
                  {categoriesToDisplay.length === 0 && <div className="text-center p-8"><p>Your wardrobe is empty!</p></div>}
                </div>
              ) : isWardrobeView ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredItems.map(item => <WardrobeItem key={item.id} item={item} onWear={wearItem} onWash={openWashModal} onDelete={openDeleteModal} />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map(item => <LaundryItem key={item.id} item={item} onWear={wearItem} onWash={openWashModal} onDelete={openDeleteModal} />)}
                </div>
              )}
            </div>
        }
      </div>

      {showWashModal && <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm"><h3 className="text-xl font-bold flex items-center"><RefreshCw size={24} className="text-green-500 mr-2" /> Mark as Washed</h3><p>Date you washed "{selectedItem.name}":</p><input type="date" value={newWashDate} onChange={e => setNewWashDate(e.target.value)} className="w-full p-3 rounded-xl mt-2" /><div className="flex justify-end space-x-3 mt-4"><button onClick={() => setShowWashModal(false)}>Cancel</button><button onClick={washItem}>Confirm</button></div></div></div>}
      {showDeleteModal && <ConfirmationModal message={`Delete "${selectedItem.name}"?`} onConfirm={deleteItem} onCancel={() => setShowDeleteModal(false)} />}
      
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h3 className="text-2xl font-bold">Settings</h3><button onClick={() => setShowSettingsModal(false)}><X/></button></div>
            <div className="mt-6 space-y-6">
              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <h4 className="flex items-center text-xl font-semibold text-pink-600"><Palette size={20} className="mr-2"/> App Customization</h4>
                <label>App Name <input type="text" value={appName} onChange={e => setAppName(e.target.value)} onBlur={e => saveCustomization({ appName: e.target.value })} className="w-full p-2 rounded-lg" /></label>
                <label>Caption <input type="text" value={appCaption} onChange={e => setAppCaption(e.target.value)} onBlur={e => saveCustomization({ appCaption: e.target.value })} className="w-full p-2 rounded-lg" /></label>
                <label>BG Color <div className="flex items-center"><input type="color" value={primaryBgColor} onChange={e => setPrimaryBgColor(e.target.value)} onBlur={e => saveCustomization({ primaryBgColor: e.target.value })} /><span className="ml-2">{primaryBgColor}</span></div></label>
                <label>Font <select value={fontFamily} onChange={e => saveCustomization({ fontFamily: e.target.value })} className="w-full p-2 rounded-lg">{availableFonts.map(f => <option key={f.name} value={f.style}>{f.name}</option>)}</select></label>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <h4 className="text-xl font-semibold">Reorder & Hide Categories</h4>
                <div className="max-h-48 overflow-y-auto">{displayCategoryOrder.map((cat, i) => <div key={cat.name} className="flex items-center justify-between p-2"><span>{cat.name}</span><div><button onClick={() => toggleCategoryVisibility(i)}>{cat.visible ? <Eye/> : <EyeOff/>}</button><button onClick={() => moveCategory(i, 'up')} disabled={i === 0}><ArrowUp/></button><button onClick={() => moveCategory(i, 'down')} disabled={i === displayCategoryOrder.length-1}><ArrowDown/></button></div></div>)}</div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <h4 className="flex items-center text-xl font-semibold text-indigo-600"><KeyRound size={20} className="mr-2"/> Shared Data Key</h4>
                <p className="text-sm text-red-600 p-2 bg-red-100 rounded-lg">⚠️ Data stored under a shared key is public.</p>
                {dataKey !== authUid ? <div><p>Viewing shared key: <b>{dataKey}</b></p><button onClick={clearSharedKey}>Revert to Private Data</button></div> : <form onSubmit={setSharedKey}><input type="text" value={sharedKeyInput} onChange={e => setSharedKeyInput(e.target.value)} placeholder="Enter shared key" className="w-full p-2 rounded-lg" /><button type="submit" disabled={sharedKeyInput.trim().length < 4}>Set Shared Key</button><p className="text-xs text-center">Your private ID: {authUid}</p></form>}
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <h4 className="text-xl font-semibold">Add New Category</h4>
                <form onSubmit={addCategory} className="flex space-x-2"><input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category Name" className="flex-1 p-3 rounded-xl" /><button type="submit" disabled={!newCategoryName.trim()}><Plus/></button></form>
                <div className="flex flex-wrap gap-2">{allCategories.map(c => <span key={c} className="px-3 py-1 bg-slate-300 rounded-full text-xs">{c}</span>)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

