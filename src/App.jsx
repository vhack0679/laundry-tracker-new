import React, { useState, useEffect, useCallback } from 'react';
// ** Firebase imports are removed **
import {
  AlertCircle,
  Plus,
  Trash,
  CheckCircle,
  Shirt,
  RefreshCw,
  ArrowDownWideNarrow,
  CalendarDays,
  Tag,
  List,
  Grid,
  Settings,
  KeyRound,
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

// --- API Configuration ---
// !!! IMPORTANT: Replace this URL with the actual URL of your PHP API script on your server.
const API_URL = 'https://v-ruchira.rf.gd/api/api.php'; 

// --- Utility Functions ---

const getTimeSince = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays < 0) return 'In the future'; // Handle date inconsistencies
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
};


// --- React Components (No changes needed in these components) ---

const LaundryItem = ({ item, onWear, onWash, onDelete }) => {
  const needsWashing = item.usage_count >= 3;
  const timeSinceWashed = getTimeSince(item.last_washed);

  const getImageUrl = (item) => {
    if (item.image_url && item.image_url.trim() !== '' && !item.image_url.includes('Image+Too+Large')) return item.image_url;
    return `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'Item').substring(0, 3)}`;
  };

  return (
    <div className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${needsWashing ? 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} shadow-sm border`}>
      <div className="flex-1 flex items-center space-x-3 sm:space-x-4">
        {item.image_url && item.image_url.trim() !== '' && !item.image_url.includes('Image+Too+Large') ? (
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
            <span className="font-medium text-slate-700 dark:text-slate-300">Worn: {item.usage_count} times</span>
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
    const needsWashing = item.usage_count >= 3;
    const timeSinceWashed = getTimeSince(item.last_washed);
    const imageUrl = item.image_url && item.image_url.trim() !== '' ? item.image_url : `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'I').substring(0, 3)}`;

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
                <p className="font-medium">Worn: {item.usage_count}</p>
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
  const [userId, setUserId] = useState(null); // Replaces authUid
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
  
  // --- Function to fetch all data from the backend ---
  const fetchAndSetData = useCallback(async (key) => {
    if (!key) return;

    if (API_URL === 'https://your-infinity-free-domain/api.php') {
        console.error(
            "API URL is not configured. Please edit App.jsx and replace the placeholder API_URL with your actual backend API endpoint. The application cannot fetch data without this."
        );
        setLaundryItems([]);
        setCustomCategories([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
        const response = await fetch(`${API_URL}?action=getData&data_key=${key}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.success) {
            setLaundryItems(data.items || []);
            setCustomCategories(data.categories ? data.categories.map(c => c.name) : []);
        } else {
            console.error("API Error:", data.error);
            setLaundryItems([]);
            setCustomCategories([]);
        }
    } catch (error) {
        console.error('Failed to fetch data:', error);
    } finally {
        setLoading(false);
    }
  }, []);

  // --- NEW: useEffect to set a local user ID, replacing Firebase Auth ---
  useEffect(() => {
    let localUserId = localStorage.getItem('laundryTrackerUserId');
    if (!localUserId) {
        localUserId = crypto.randomUUID();
        localStorage.setItem('laundryTrackerUserId', localUserId);
    }
    setUserId(localUserId);

    // Use this local ID as the default data key
    const key = localStorage.getItem('sharedDataKey') || localUserId;
    setDataKey(key);
    setSharedKeyInput(key);
  }, []);

  // --- Data fetching useEffect (MODIFIED) ---
  useEffect(() => {
    if (dataKey) {
        fetchAndSetData(dataKey);
    }
  }, [dataKey, fetchAndSetData]);


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
    setDataKey(userId);
    setSharedKeyInput(userId);
    setShowSettingsModal(false);
  };

  const sortedItems = [...laundryItems].sort((a, b) => {
    if (sortBy === 'date') return (new Date(b.last_washed) || 0) - (new Date(a.last_washed) || 0);
    if (sortBy === 'usage') return b.usage_count - a.usage_count;
    return (a.name || '').localeCompare(b.name || '');
  });

  const filteredItems = selectedCategoryFilter === 'All' ? sortedItems : sortedItems.filter(item => (item.category || 'Uncategorized') === selectedCategoryFilter);

  // --- CRUD Operations (MODIFIED to use API) ---
  
  const addItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !dataKey) return;
    const newItem = {
        id: crypto.randomUUID(), // Generate a unique ID on the client
        dataKey: dataKey,
        name: itemName.trim(),
        category: selectedCategory,
        imageData: itemImageUrl.startsWith('data:image') ? itemImageUrl : '', // only send if it's base64
        imageUrl: !itemImageUrl.startsWith('data:image') ? itemImageUrl : '', // send if it's a URL
    };

    try {
        const response = await fetch(`${API_URL}?action=addItem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });
        const result = await response.json();
        if (result.success) {
            setItemName('');
            setItemImageUrl('');
            fetchAndSetData(dataKey); // Refresh data
        } else {
            console.error('API error adding item:', result.error);
        }
    } catch (error) { console.error('Error adding item:', error); }
  };

  const addCategory = async (e) => {
      e.preventDefault();
      if (!newCategoryName.trim() || !dataKey) return;
      try {
          const response = await fetch(`${API_URL}?action=addCategory`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataKey, name: newCategoryName.trim() })
          });
          const result = await response.json();
          if(result.success) {
              setNewCategoryName('');
              fetchAndSetData(dataKey);
          } else {
              console.error('API error adding category:', result.error);
          }
      } catch (error) { console.error('Error adding category:', error); }
  };

  const wearItem = async (item) => {
    if (!dataKey) return;
    try {
        const response = await fetch(`${API_URL}?action=updateItem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: item.id,
                dataKey: dataKey,
                updates: { usageCount: (item.usage_count || 0) + 1 }
            })
        });
        const result = await response.json();
        if (result.success) fetchAndSetData(dataKey);
    } catch (error) { console.error('Error updating item:', error); }
  };
  
  const openWashModal = (item) => {
    setSelectedItem(item);
    const date = item.last_washed ? new Date(item.last_washed) : new Date();
    setNewWashDate(date.toISOString().substring(0, 10));
    setShowWashModal(true);
  };

  const washItem = async () => {
    if (!dataKey || !selectedItem || !newWashDate) return;
    try {
        const response = await fetch(`${API_URL}?action=updateItem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedItem.id,
                dataKey: dataKey,
                updates: {
                    usageCount: 0,
                    lastWashed: new Date(newWashDate).toISOString(),
                }
            })
        });
        const result = await response.json();
        if (result.success) {
            setShowWashModal(false);
            setSelectedItem(null);
            fetchAndSetData(dataKey);
        }
    } catch (error) { console.error('Error washing item:', error); }
  };

  const openDeleteModal = (item) => { setSelectedItem(item); setShowDeleteModal(true); };

  const deleteItem = async () => {
    if (!dataKey || !selectedItem) return;
    try {
        const response = await fetch(`${API_URL}?action=deleteItem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedItem.id, dataKey: dataKey })
        });
        const result = await response.json();
        if(result.success) {
            setShowDeleteModal(false);
            setSelectedItem(null);
            fetchAndSetData(dataKey);
        }
    } catch (error) { console.error('Error deleting item:', error); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result.length > 1024 * 1024) { // 1MB limit for base64
          setItemImageUrl(`https://placehold.co/150x50/ff0000/ffffff?text=Image+Too+Large`);
          console.error("Image too large. Max 1MB allowed.");
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
  }, []);
  
  const itemsByCategory = sortedItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
  const categoriesToDisplay = allCategories.filter(cat => (itemsByCategory[cat] || []).length > 0);


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
              <span className={`font-mono text-xs p-1 rounded-md ${dataKey && dataKey !== userId ? 'bg-indigo-500 text-white' : 'bg-slate-300 dark:bg-slate-700'} break-all`}>{dataKey || 'Loading...'}</span>
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
              {dataKey !== userId && <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl text-sm text-center"><KeyRound size={16} className="inline mr-2" />Viewing shared wardrobe: <b>{dataKey}</b></div>}
              {isWardrobeView && selectedCategoryFilter === 'All' ? (
                <div className="space-y-6">
                  {categoriesToDisplay.map(cat => <CategoryRow key={cat} category={cat} items={itemsByCategory[cat]} onWear={wearItem} onWash={openWashModal} onDelete={openDeleteModal} />)}
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
              
              {/* Omitted settings sections for brevity - they don't need changes */}
              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <h4 className="flex items-center text-xl font-semibold text-indigo-600"><KeyRound size={20} className="mr-2"/> Shared Data Key</h4>
                <p className="text-sm text-red-600 p-2 bg-red-100 rounded-lg">⚠️ Data stored under a shared key is public.</p>
                {dataKey !== userId ? <div><p>Viewing shared key: <b>{dataKey}</b></p><button onClick={clearSharedKey}>Revert to Private Data</button></div> : <form onSubmit={setSharedKey}><input type="text" value={sharedKeyInput} onChange={e => setSharedKeyInput(e.target.value)} placeholder="Enter shared key" className="w-full p-2 rounded-lg" /><button type="submit" disabled={sharedKeyInput.trim().length < 4}>Set Shared Key</button><p className="text-xs text-center">Your private ID: {userId}</p></form>}
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

